import { inject } from "@angular/core";
import { type CanActivateFn, Router, type Routes } from "@angular/router";
import { destinoDaRota } from "../../../comum/rotas";
import { auth } from "./firebase";

/** A área do organizador exige login; sem ele, vai para #/entrar. */
const soOrganizador: CanActivateFn = async () => {
  await auth.authStateReady();
  const destino = destinoDaRota("organizador", auth.currentUser !== null);
  return destino.tela === "organizador" ? true : inject(Router).parseUrl("/entrar");
};

export const routes: Routes = [
  { path: "entrar", loadComponent: () => import("./entrar/entrar").then((m) => m.Entrar) },
  {
    path: "organizador",
    canActivate: [soOrganizador],
    loadComponent: () => import("./organizador/organizador").then((m) => m.Organizador),
  },
  { path: "l/:token", loadComponent: () => import("./link/link").then((m) => m.Link) },
  { path: "**", redirectTo: "entrar" },
];
