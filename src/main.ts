import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./styles.css";
import {
  AboutPage,
  BlogIndexPage,
  BlogPostPage,
  HomePage,
  ProjectsPage,
} from "./pages";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/projects", component: ProjectsPage },
    { path: "/blog", component: BlogIndexPage },
    { path: "/blog/:slug", component: BlogPostPage },
    { path: "/about", component: AboutPage },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

createApp(App).use(router).mount("#app");
