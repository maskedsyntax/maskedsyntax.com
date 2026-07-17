import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";
import { getPostBySlug } from "./lib/blog";
import { applyPageMeta, metaForPath } from "./lib/seo";
import {
  AboutPage,
  BlogIndexPage,
  BlogPostPage,
  HomePage,
} from "./pages";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/projects", redirect: "/" },
    { path: "/blog", component: BlogIndexPage },
    { path: "/blog/:slug", component: BlogPostPage },
    { path: "/about", component: AboutPage },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.path.startsWith("/blog/") && to.params.slug) {
    const post = getPostBySlug(String(to.params.slug));
    if (post) {
      applyPageMeta({
        title: post.title,
        description: post.summary,
        path: to.path,
        ogType: "article",
      });
      return;
    }
    applyPageMeta({ path: to.path, noIndex: true });
    return;
  }

  applyPageMeta(metaForPath(to.path));
});

createApp(App).use(router).mount("#app");
