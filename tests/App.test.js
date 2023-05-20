import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import App from "../src/App.vue";

describe('App', () => {
  it('should render', () => {
    const app = shallowMount(App);
    expect(app.exists()).toBe(true);
  });
});
