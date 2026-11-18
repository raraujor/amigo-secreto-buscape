import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { signOut } from "firebase/auth";
import { confirmouRecomecar } from "../../../../comum/confirmacao";
import { formatarDataHora } from "../../../../comum/data";
import { mensagemDeErro } from "../../../../comum/erros";
import { linkWhatsapp, montarMensagem } from "../../../../comum/mensagens";
import { prepararImportacao } from "../../../../comum/planilha";
import {
  type Encontro,
  type Participante,
  gravarEncontro,
  gravarSorteio,
  importarParticipantes,
  lerEncontro,
  lerLinks,
  lerParticipantes,
  lerResultado,
  lerSorteioAtual,
  recomecar,
  resumoDoSorteio,
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
      <p class="dica">Planilha CSV com as colunas nome, whatsapp e responsavel (até 80 pessoas).</p>
      <input type="file" accept=".csv,text/csv" (change)="importar($event)" />
      @if (errosPlanilha().length) {
        <p class="erro">A planilha não foi importada. Corrija e envie de novo:</p>
        <ul class="erro">@for (e of errosPlanilha(); track e) { <li>{{ e }}</li> }</ul>
      }
      @if (avisosPlanilha().length) {
        <p class="aviso">Importada, com avisos:</p>
        <ul class="aviso">@for (a of avisosPlanilha(); track a) { <li>{{ a }}</li> }</ul>
      }
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

      <section class="cartao">
        <h2>Resultado completo</h2>
        <p class="dica">Só você vê. Some de novo ao recarregar a página.</p>
        <button type="button" (click)="alternarResultado()">
          {{ resultado() ? "Esconder resultado" : "Mostrar resultado (só você vê)" }}</button>
        @if (resultado(); as pares) {
          <table>
            <tr><th>Quem</th><th>tirou</th></tr>
            @for (r of pares; track r.participante) {
              <tr><td>{{ r.participante }}</td><td>{{ r.amigo }}</td></tr>
            }
          </table>
        }
      </section>

      <section class="cartao perigo">
        <h2>Recomeçar do zero</h2>
        <p>Isso apaga <strong>{{ resumo().links }} links</strong>, <strong>{{ resumo().enviadas }} mensagens enviadas</strong>
          e <strong>{{ resumo().abertos }} aberturas</strong>.</p>
        <p class="dica">Os links que as pessoas já receberam deixam de funcionar e elas precisam receber de novo.
          A lista de participantes e os dados do encontro ficam.</p>
        <label>Para confirmar, digite RECOMEÇAR
          <input type="text" name="confirmacao" [(ngModel)]="confirmacao" autocomplete="off" /></label>
        <button type="button" class="perigo-botao" (click)="recomecarTudo()"
          [disabled]="!podeRecomecar()">{{ apagando() ? "Apagando…" : "Recomeçar do zero" }}</button>
        @if (mensagemRecomeco()) { <p class="visto-msg">{{ mensagemRecomeco() }}</p> }
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
  readonly errosPlanilha = signal<string[]>([]);
  readonly avisosPlanilha = signal<string[]>([]);
  readonly copiado = signal("");
  /** O resultado completo só é lido e desenhado depois do toque no botão. */
  readonly resultado = signal<{ participante: string; amigo: string }[] | null>(null);
  readonly resumo = signal({ links: 0, enviadas: 0, abertos: 0 });
  confirmacao = "";
  readonly apagando = signal(false);
  readonly mensagemRecomeco = signal("");
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
    this.resumo.set(await resumoDoSorteio(db));
  }

  async importar(evento: Event): Promise<void> {
    this.erro.set("");
    this.errosPlanilha.set([]);
    this.avisosPlanilha.set([]);
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    try {
      const pronto = prepararImportacao(new Uint8Array(await arquivo.arrayBuffer()));
      if (pronto.erros.length) {
        this.errosPlanilha.set(pronto.erros);
        return;
      }
      await importarParticipantes(db, pronto.linhas);
      this.avisosPlanilha.set(pronto.avisos);
      this.resultado.set(null);
      this.participantes.set(await lerParticipantes(db));
      await this.carregarLinks();
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message, "importar"));
    }
  }

  async sortear(): Promise<void> {
    this.erro.set("");
    if (this.links().length > 0 && !confirm("Sortear de novo invalida os links atuais. Continuar?")) return;
    try {
      await gravarSorteio(db);
      this.resultado.set(null);
      await this.carregarLinks();
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message, "sortear"));
    }
  }

  async alternarResultado(): Promise<void> {
    if (this.resultado()) {
      this.resultado.set(null);
      return;
    }
    try {
      this.resultado.set(await lerResultado(db));
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message));
    }
  }

  podeRecomecar(): boolean {
    return confirmouRecomecar(this.confirmacao) && !this.apagando();
  }

  async recomecarTudo(): Promise<void> {
    if (!this.podeRecomecar()) return;
    this.apagando.set(true);
    this.mensagemRecomeco.set("");
    try {
      await recomecar(db);
      this.confirmacao = "";
      this.resultado.set(null);
      await this.carregarLinks();
      this.mensagemRecomeco.set("Tudo recomeçado. Você pode importar e sortear de novo.");
    } catch {
      this.mensagemRecomeco.set("Nada foi apagado. Tente de novo.");
    } finally {
      this.apagando.set(false);
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
