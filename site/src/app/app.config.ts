import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";
import { routes } from "./app.routes";

// Rotas por hash (#/l/<token>): o GitHub Pages não reescreve caminhos para a aplicação.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes, withHashLocation())],
};
