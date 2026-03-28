---
title: "FractalDive: Float64, CUDA, and a BigFloat toggle"
date: "2025-10-28"
tags: ["experiments", "julia", "cuda", "numerics"]
summary: "The UI exposes high_precision: BigFloat on CPU vs Float64, and it refuses the GPU when BigFloat is on. The engine shares one kernel shape for Mandelbrot and Julia sets."
reading_time: "5 min"
---

Deep Mandelbrot zooms hit a wall where `Float64` cannot separate neighboring pixels in the complex plane. FractalDive is a Julia project with a Makie UI, a CPU threaded renderer, and an optional CUDA path. The interesting design choice is **how the UI picks a numeric type** and how `render_fractal!` dispatches to GPU only when that type is `Float64`. If you add arbitrary precision on GPU later, you will need a different plan; for now the split is explicit and easy to explain.

## Generic pixels, smooth iteration, and two backends

`FractalEngine.jl` uses a normalized escape time so bands look less harsh. `mandelbrot_pixel` and `julia_pixel` are generic over `T`, which lets the UI swap `BigFloat` in without forking the algorithm text.

```julia
@inline function mandelbrot_pixel(c::Complex{T}, max_iter::Int) where {T<:Real}
    z = complex(zero(T), zero(T))
    for i in 1:max_iter
        z = z*z + c
        if abs2(z) > 16.0
            return (i + 1.0 - 0.5 * log2(log(abs2(z)))) / max_iter
        end
    end
    return 0.0
end
```

The CUDA kernel indexes a 2D grid, builds `p` from `x_range` and `y_range`, and calls the same pixel functions. `render_fractal_gpu!` uses 16 by 16 threads and enough blocks to cover the image; it assumes `CuArray` inputs.

```julia
function fractal_kernel(output, x_range, y_range, max_iter, is_julia, julia_c)
    i = (blockIdx().x - 1) * blockDim().x + threadIdx().x
    j = (blockIdx().y - 1) * blockDim().y + threadIdx().y
    nx, ny = size(output)
    if i <= nx && j <= ny
        p = complex(x_range[i], y_range[j])
        if is_julia
            output[i, j] = julia_pixel(p, julia_c, max_iter)
        else
            output[i, j] = mandelbrot_pixel(p, max_iter)
        end
    end
    return nothing
end
```

Off GPU, `render_fractal!` uses `@threads` over rows, checks an optional `stop_signal` between rows, and calls `yield()` so the UI can breathe.

```julia
@threads for j in 1:ny
    if stop_signal !== nothing && stop_signal[]
        break
    end
    @inbounds for i in 1:nx
        p = complex(x_range[i], y_range[j])
        if is_julia
            output[i, j] = julia_pixel(p, julia_c, max_iter)
        else
            output[i, j] = mandelbrot_pixel(p, max_iter)
        end
    end
    yield()
end
```

## UI modes, ranges, color, and export

`FractalUI.jl` keeps `high_precision = Observable(false)`. When you flip the toggle, `T` becomes `BigFloat` or `Float64`, and `use_gpu` only stays meaningful when you are not in high precision:

```julia
T = high_precision[] ? BigFloat : Float64
# ...
if use_gpu[] && CUDA.functional() && !high_precision[]
```

**GPU for speed where doubles are honest**, **CPU BigFloat for depth where they are not**. The UI builds `x_range` and `y_range` from viewport corners. When those ranges shrink below `eps(T)`, neighboring entries collapse to the same float: that is the signal to flip `high_precision` or bump `max_iter`. I treat it as a **user-visible mode** instead of silently switching types mid-drag so recordings stay reproducible. Sliders and `onany` handlers trigger recomputation; `is_rendering` guards against double-starts. Auto iteration can bump `max_iter` when zoom depth increases so black interiors still resolve.

`ColorSchemes.jl` maps normalized escape values to palettes. Washed-out frames often mean linear versus sRGB mismatch, not broken math. `Exporter.jl` dumps PNG sequences for video tools; resolution matches the on-screen framebuffer, and whatever format you pick should keep the same `render_fractal!` contract so batch renders match the window. I lost an afternoon once to export using a stale `max_iter` default.

`CUDA.functional()` checks driver and device; laptops without NVIDIA stay on threaded CPU mode without user intervention. `FractalDive.jl` loads submodules and starts the UI; `runtests.jl` exercises engine functions without a display when possible. CUDA.jl and Makie pin versions tightly; I update them together when upgrading Julia.

## After

FractalDive is a playground. The code I reread is the generic `*_pixel` plus the dispatch in `render_fractal!`. The hard part is not typing `BigFloat`; it is knowing **when** you need it.

Julia's generics paid for themselves the first time I flipped Julia set mode without duplicating the escape loop. The CUDA path stays boring on purpose: same math, different allocator. If the kernel ever diverges from CPU for the same inputs, I assume the bug is range construction or a stale buffer, not transcendental identities.

Makie redraw cost dominates some sessions more than the fractal math. That is a reminder that "scientific" UIs are still UIs: throttle observables before you optimize the inner loop.

Recording a zoom video taught me more about float precision than any textbook paragraph: you see banding appear in real time when `x_range` stops moving but the pixels still think they are adjacent.

I keep CUDA and CPU renders of the same viewport in regression folders. Bitwise equality is too strict because of thread order; max absolute error thresholds catch the bugs that matter for demos.
