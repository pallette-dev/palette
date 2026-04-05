import { mount } from "svelte";
import App from "./App.svelte";
import "./globals.css";

mount(App, { target: document.getElementById("app")! });
