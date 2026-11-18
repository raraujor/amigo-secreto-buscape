import { Component, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { signOut } from "firebase/auth";
import { lerCsv } from "../../../../comum/csv";
import {
  type Participante,
  gravarSorteio,
  importarParticipantes,
  lerLinks,
  lerParticipantes,
} from "../dados/repositorio";
import { auth, db } from "../firebase";

interface LinkDaTela {
  nome: string;
  url: string;
}

@Component({
  selector: "app-organizador",
  template: `
    <header class="topo">
      <h1>🎄 Amigo secreto</h1>
      <button type="button" class="discreto" (click)="sair()">Sair</button>
    </header>

    <section class="cartao">
      <h2>1. Importar a lista</h2>
      <p class="dica">Planilha CSV com as colunas nome, whatsapp e responsavel.</p>
      <input type="file" accept=".csv,text/csv" (change)="importar($event)" />
      <p class="erro">{{ erro() }}</p>
    </section>

    <section class="cartao">
      <h2>2. Participantes ({{ participantes().length }})</h2>
      <table>
        <tr><th>Nome</th><th>WhatsApp</th><th>Responsável</th></tr>
        @for (p of participantes(); track p.id) {
          <tr><td>{{ p.nome }}</td><td>{{ p.whatsapp }}</td><td>{{ p.responsavel }}</td></tr>
        }
      </table>
    </section>

    <section class="cartao">
      <h2>3. Sortear</h2>
      <button type="button" (click)="sortear()" [disabled]="participantes().length === 0">🎁 Sortear</button>
    </section>

    @if (links().length) {
      <section class="cartao">
        <h2>Links do sorteio ({{ links().length }})</h2>
        <p class="dica">Os links ficam guardados: pode fechar e voltar quando quiser.</p>
        <table>
          @for (l of links(); track l.url) {
            <tr>
              <td>{{ l.nome }}</td>
              <td><button type="button" class="discreto" (click)="copiar(l.url)">
                {{ copiado() === l.url ? "Copiado ✓" : "Copiar link" }}</button></td>
            </tr>
          }
        </table>
      </section>
    }
  `,
})
export class Organizador implements OnInit {
  readonly participantes = signal<Participante[]>([]);
  readonly links = signal<LinkDaTela[]>([]);
  readonly erro = signal("");
  readonly copiado = signal("");
  private readonly base = `${location.origin}${location.pathname}#/l/`;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    this.participantes.set(await lerParticipantes(db));
    await this.carregarLinks();
  }

  /** Lê do banco os links do último sorteio, na ordem da planilha. */
  private async carregarLinks(): Promise<void> {
    const tokens = new Map((await lerLinks(db)).map((l) => [l.participanteId, l.token]));
    this.links.set(
      this.participantes()
        .filter((p) => tokens.has(p.id))
        .map((p) => ({ nome: p.nome, url: `${this.base}${tokens.get(p.id)}` })),
    );
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
      await gravarSorteio(db);
      await this.carregarLinks();
    } catch (e) {
      this.erro.set(
        (e as Error).message === "MINIMO_DOIS"
          ? "São precisos ao menos 2 participantes para sortear."
          : "Não foi possível sortear.",
      );
    }
  }

  async copiar(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
    this.copiado.set(url);
  }

  async sair(): Promise<void> {
    await signOut(auth);
    await this.router.navigateByUrl("/entrar");
  }
}
