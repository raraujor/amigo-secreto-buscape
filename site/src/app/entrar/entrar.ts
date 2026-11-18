import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

@Component({
  selector: "app-entrar",
  imports: [FormsModule],
  template: `
    <h1>Área do organizador</h1>
    <form (ngSubmit)="entrar()">
      <label>E-mail <input type="email" name="email" [(ngModel)]="email" autocomplete="username" /></label>
      <label>Senha <input type="password" name="senha" [(ngModel)]="senha" autocomplete="current-password" /></label>
      <button type="submit">Entrar</button>
      @if (erro()) { <p class="erro">{{ erro() }}</p> }
    </form>
  `,
})
export class Entrar {
  email = "";
  senha = "";
  readonly erro = signal("");

  constructor(private readonly router: Router) {}

  async entrar(): Promise<void> {
    this.erro.set("");
    try {
      await signInWithEmailAndPassword(auth, this.email, this.senha);
      await this.router.navigateByUrl("/organizador");
    } catch {
      this.erro.set("Usuário ou senha incorretos.");
    }
  }
}
