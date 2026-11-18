import { Component, OnInit, signal } from "@angular/core";
import { Router } from "@angular/router";
import { signOut } from "firebase/auth";
import { lerCsv } from "../../../../comum/csv";
import { formatarDataHora } from "../../../../comum/data";
import { linkWhatsapp, montarMensagem } from "../../../../comum/mensagens";
import { FormsModule } from "@angular/forms";
import {
  type Encontro,
  type Participante,
  gravarEncontro,
  gravarSorteio,
  importarParticipantes,
  lerEncontro,
  lerLinks,
  lerParticipantes,
  lerSorteioAtual,
} from "../dados/repositorio";
import { auth, db } from "../firebase";

interface LinkDaTela {
  nome: string;
  url: string;
  /** Quando a pessoa tocou em "Ver quem eu tirei"; null se ainda não tocou. */
  vistoEm: string | null;
  /** Abre o WhatsApp na conversa com o número, com a mensagem pronta. */
  whatsapp: string;
}

@Component({
  selector: "app-organizador",
  imports: [FormsModule],
  template: `
    <header class="topo">
      <h1>🎄 Amigo secreto</h1>
      <button type="button" class="discreto" (click)="sair()">Sair</button>
    </header>

    <section class="cartao">
      <h2>Dados do encontro</h2>
      <p class="dica">Aparecem na página de cada participante depois que ele descobre o amigo secreto.</p>
      <label>Data <input type="text" name="data" [(ngModel)]="encontro.data" /></label>
      <label>Local <input type="text" name="local" [(ngModel)]="encontro.local" /></label>
      <label>Valor sugerido <input type="text" name="valor" [(ngModel)]="encontro.valor" /></label>
      <button type="button" (click)="salvarEncontro()">Salvar dados do encontro</button>
      @if (encontroSalvo()) { <p class="visto-msg">✓ Salvo. Já aparece nos links.</p> }
    </section>

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
        <h2>Links do sorteio ({{ links().length }}) - {{ sorteadoEm() }}</h2>
        <p class="dica">Os links ficam guardados: pode fechar e voltar quando quiser.</p>
        <table>
          @for (l of links(); track l.url) {
            <tr>
              <td>{{ l.nome }}</td>
              <td [class.visto]="l.vistoEm">{{ l.vistoEm ? "✓ Já viu em " + l.vistoEm : "Ainda não viu" }}</td>
              <td>
                <a class="whats" [href]="l.whatsapp" target="_blank" rel="noopener">💬 Enviar pelo WhatsApp</a>
                <button type="button" class="discreto" (click)="copiar(l.url)">
                  {{ copiado() === l.url ? "Copiado ✓" : "Copiar link" }}</button>
              </td>
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
  readonly sorteadoEm = signal("");
  /** Valores sugeridos até o organizador salvar os dados reais. */
  encontro: Encontro = { data: "24/12/2026", local: "Fazenda da Titia", valor: "R$ 50,00" };
  readonly encontroSalvo = signal(false);
  readonly erro = signal("");
  readonly copiado = signal("");
  private readonly base = `${location.origin}${location.pathname}#/l/`;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    this.participantes.set(await lerParticipantes(db));
    await this.carregarLinks();
    const salvo = await lerEncontro(db);
    if (salvo) {
      this.encontro = salvo;
      this.encontroSalvo.set(true);
    } else {
      // Ainda sem dados gravados: grava os sugeridos, para os links já mostrarem o encontro.
      await this.salvarEncontro();
    }
  }

  async salvarEncontro(): Promise<void> {
    await gravarEncontro(db, this.encontro);
    this.encontroSalvo.set(true);
  }

  /** Lê do banco os links do último sorteio, na ordem da planilha. */
  private async carregarLinks(): Promise<void> {
    const porParticipante = new Map((await lerLinks(db)).map((l) => [l.participanteId, l]));
    this.links.set(
      this.participantes()
        .filter((p) => porParticipante.has(p.id))
        .map((p) => {
          const link = porParticipante.get(p.id);
          const url = `${this.base}${link?.token}`;
          return {
            nome: p.nome,
            url,
            vistoEm: link?.abertoEm ? formatarDataHora(link.abertoEm) : null,
            whatsapp: linkWhatsapp(p.whatsapp, montarMensagem(p, url)),
          };
        }),
    );
    const sorteio = await lerSorteioAtual(db);
    this.sorteadoEm.set(sorteio ? formatarDataHora(sorteio.criadoEm) : "");
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
