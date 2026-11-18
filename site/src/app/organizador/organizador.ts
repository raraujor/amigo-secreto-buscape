import { Component, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { signOut } from "firebase/auth";
import { lerCsv } from "../../../../comum/csv";
import { type Participante, gravarSorteio, importarParticipantes, lerParticipantes } from "../dados/repositorio";
import { auth, db } from "../firebase";

@Component({
  selector: "app-organizador",
  template: `
    <h1>Área do organizador</h1>
    <p><button type="button" (click)="sair()">Sair</button></p>

    <h2>1. Importar a lista</h2>
    <input type="file" accept=".csv,text/csv" (change)="importar($event)" />
    <p class="erro">{{ erro() }}</p>

    <h2>2. Participantes ({{ participantes().length }})</h2>
    <table>
      <tr><th>Nome</th><th>WhatsApp</th><th>Responsável</th></tr>
      @for (p of participantes(); track p.id) {
        <tr><td>{{ p.nome }}</td><td>{{ p.whatsapp }}</td><td>{{ p.responsavel }}</td></tr>
      }
    </table>

    <h2>3. Sortear</h2>
    <button type="button" (click)="sortear()" [disabled]="participantes().length === 0">Sortear</button>
    @if (links().length) {
      <p>Sorteio feito. Links gerados (endereço base: {{ base }}):</p>
      <table>
        @for (l of links(); track l.nome) {
          <tr><td>{{ l.nome }}</td><td><a [href]="l.url">{{ l.url }}</a></td></tr>
        }
      </table>
    }
  `,
})
export class Organizador implements OnInit {
  readonly participantes = signal<Participante[]>([]);
  readonly links = signal<{ nome: string; url: string }[]>([]);
  readonly erro = signal("");
  readonly base = `${location.origin}${location.pathname}#/l/`;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    this.participantes.set(await lerParticipantes(db));
  }

  async importar(evento: Event): Promise<void> {
    this.erro.set("");
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    try {
      const texto = new TextDecoder("utf-8").decode(await arquivo.arrayBuffer());
      await importarParticipantes(db, lerCsv(texto));
      this.participantes.set(await lerParticipantes(db));
    } catch {
      this.erro.set("Não foi possível ler a planilha. Confira as colunas nome, whatsapp e responsavel.");
    }
  }

  async sortear(): Promise<void> {
    this.erro.set("");
    try {
      const { tokens } = await gravarSorteio(db);
      this.links.set(
        this.participantes().map((p) => ({ nome: p.nome, url: `${this.base}${tokens.get(p.id)}` })),
      );
    } catch (e) {
      this.erro.set(
        (e as Error).message === "MINIMO_DOIS"
          ? "São precisos ao menos 2 participantes para sortear."
          : "Não foi possível sortear.",
      );
    }
  }

  async sair(): Promise<void> {
    await signOut(auth);
    await this.router.navigateByUrl("/entrar");
  }
}
