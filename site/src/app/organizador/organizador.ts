import { Component, OnInit, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { signOut } from "firebase/auth";
import { confirmouRecomecar } from "../../../../comum/confirmacao";
import { formatarDataHora } from "../../../../comum/data";
import { mensagemDeErro } from "../../../../comum/erros";
import { chaveDaLista, resumoDeListas, textoDaLista } from "../../../../comum/lista";
import { linkWhatsapp, resumoDeEnvio, rotuloDoStatus, textoDaMensagem } from "../../../../comum/mensagens";
import { prepararImportacao } from "../../../../comum/planilha";
import { resultadoEmTexto } from "../../../../comum/resultado";
import {
  type Encontro,
  type Participante,
  desfazerEnvio,
  gravarEncontro,
  gravarLista,
  gravarSorteio,
  importarParticipantes,
  lerEncontro,
  lerLinks,
  lerListas,
  lerMensagens,
  lerParticipantes,
  lerResultado,
  lerSorteioAtual,
  marcarEnviada,
  recomecar,
  resumoDoSorteio,
  sincronizarPresentes,
} from "../dados/repositorio";
import { auth, db } from "../firebase";

interface LinkDaTela {
  participanteId: string;
  token: string;
  nome: string;
  url: string;
  /** Número do WhatsApp da linha e o texto da mensagem (o gravado, ou o montado na hora). */
  numero: string;
  texto: string;
  status: string;
  rotulo: string;
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
        <tr><th>Nome</th><th>WhatsApp</th><th>Responsável</th><th>Lista de presentes</th></tr>
        @for (linha of linhasDaTabela(); track linha.p.id) {
          <tr>
            <td>{{ linha.p.nome }}</td><td>{{ linha.p.whatsapp }}</td><td>{{ linha.p.responsavel }}</td>
            <td>
              <span [class.visto]="linha.comLista">{{ linha.comLista ? "com lista" : "sem lista" }}</span>
              <button type="button" class="discreto" (click)="abrirLista(linha.p)">
                {{ editando() === linha.p.id ? "Fechar" : "Lista de presentes" }}</button>
            </td>
          </tr>
          @if (editando() === linha.p.id) {
            <tr>
              <td colspan="4">
                <label>Lista de presentes de {{ linha.p.nome }}
                  <textarea name="lista" rows="6" [(ngModel)]="textoEdicao"
                    placeholder="Um item por linha"></textarea></label>
                <p class="dica">Até 20 itens, de até 200 caracteres cada. Texto vazio apaga a lista.
                  Aparece no link de quem tirou {{ linha.p.nome }}, quando a pessoa toca em Ver quem eu tirei.</p>
                <button type="button" (click)="salvarLista(linha.p)">Salvar lista</button>
                <button type="button" class="discreto" (click)="fecharLista()">Cancelar</button>
                <p class="erro">{{ erroLista() }}</p>
              </td>
            </tr>
          }
        }
      </table>
    </section>

    <section class="cartao">
      <h2>3. Sortear</h2>
      <button type="button" (click)="sortear()" [disabled]="participantes().length === 0">🎁 Sortear</button>
    </section>

    @if (links().length) {
      <section class="cartao">
        <h2>{{ tituloDaLista() }}</h2>
        <p class="dica">Os links ficam guardados: pode fechar e voltar quando quiser.</p>
        @if (enviadas() > 0) {
          <p class="aviso">Os links já saíram: sortear de novo e importar outra lista ficam bloqueados.
            Para refazer, use Recomeçar do zero.</p>
        }
        <p class="erro">{{ erro() }}</p>
        <table>
          @for (l of links(); track l.url) {
            <tr>
              <td>
                <strong>{{ l.nome }}</strong>
                <div class="estado">
                  <span [class.visto]="l.status === 'enviada'" [class.aviso]="l.status === 'falha'">{{ l.rotulo }}</span>
                  <span [class.visto]="l.vistoEm"> · {{ l.vistoEm ? "já viu em " + l.vistoEm : "ainda não viu" }}</span>
                </div>
              </td>
              <td class="acoes">
                <a class="whats" [href]="l.whatsapp" target="_blank" rel="noopener" (click)="enviarPeloWhatsApp(l)">
                  💬 {{ l.status === "enviada" ? "Enviar de novo" : "Enviar pelo WhatsApp" }}</a>
                @if (l.status === "enviada") {
                  <button type="button" class="discreto" (click)="desfazer(l)">Desfazer</button>
                }
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
        <button type="button" class="discreto" (click)="copiarResultado()">Copiar resultado</button>
        @if (mensagemCopia()) { <p class="visto-msg">{{ mensagemCopia() }}</p> }
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
  readonly enviadas = signal(0);
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
  readonly mensagemCopia = signal("");
  /** As listas de presentes guardadas: chave do nome → itens. */
  readonly listas = signal(new Map<string, string[]>());
  readonly linhasDaTabela = computed(() => {
    const resumo = resumoDeListas(this.participantes(), new Set(this.listas().keys()));
    return this.participantes().map((p, i) => ({ p, comLista: resumo[i].comLista }));
  });
  /** O participante cuja lista está aberta para edição, o texto da caixa e o erro do salvamento. */
  readonly editando = signal<string | null>(null);
  readonly erroLista = signal("");
  textoEdicao = "";
  confirmacao = "";
  readonly apagando = signal(false);
  readonly mensagemRecomeco = signal("");
  private readonly base = `${location.origin}${location.pathname}#/l/`;

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    this.participantes.set(await lerParticipantes(db));
    // Refaz os presentes que os links leem, caso algum tenha ficado fora de sincronia; falha não impede a tela.
    await sincronizarPresentes(db).catch(() => undefined);
    this.listas.set(await lerListas(db));
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
    const [linksLidos, mensagens] = await Promise.all([lerLinks(db), lerMensagens(db)]);
    const porParticipante = new Map(linksLidos.map((l) => [l.participanteId, l]));
    this.links.set(
      this.participantes()
        .filter((p) => porParticipante.has(p.id))
        .map((p) => {
          const link = porParticipante.get(p.id);
          const token = link?.token ?? "";
          const url = `${this.base}${token}`;
          const gravada = mensagens.get(p.id);
          const texto = textoDaMensagem(gravada, p, url);
          const numero = gravada?.whatsapp || p.whatsapp;
          const status = gravada?.status ?? "pendente";
          return {
            participanteId: p.id,
            token,
            nome: p.nome,
            url,
            numero,
            texto,
            status,
            rotulo: rotuloDoStatus(status),
            vistoEm: link?.abertoEm ? formatarDataHora(link.abertoEm) : null,
            whatsapp: linkWhatsapp(numero, texto),
          };
        }),
    );
    this.enviadas.set([...mensagens.values()].filter((m) => m.status === "enviada").length);
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
      const { presentesOk } = await gravarSorteio(db, { baseUrl: this.base });
      this.resultado.set(null);
      await this.carregarLinks();
      if (!presentesOk)
        this.erro.set("Os links valem, mas as listas de presentes ainda não foram ligadas a eles. Recarregue a página.");
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

  /**
   * Copia o resultado completo (um par por linha, para colar numa planilha) sem mostrá-lo na
   * tela. O texto copiado fica na área de transferência até ser trocado: só o organizador vê.
   */
  async copiarResultado(): Promise<void> {
    this.erro.set("");
    this.mensagemCopia.set("");
    try {
      const pares = this.resultado() ?? (await lerResultado(db));
      await navigator.clipboard.writeText(resultadoEmTexto(pares));
      this.mensagemCopia.set(`✓ Resultado copiado (${pares.length} pares). Cole numa planilha para conferir.`);
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message));
    }
  }

  /** Abre ou fecha a edição da lista de uma pessoa, com a lista atual na caixa de texto. */
  abrirLista(p: Participante): void {
    this.erroLista.set("");
    if (this.editando() === p.id) {
      this.editando.set(null);
      return;
    }
    this.textoEdicao = textoDaLista(this.listas().get(chaveDaLista(p.nome)) ?? []);
    this.editando.set(p.id);
  }

  fecharLista(): void {
    this.erroLista.set("");
    this.editando.set(null);
  }

  /**
   * Grava a lista da pessoa. Na falha (limite, rede) nada é gravado, a edição continua aberta e o
   * texto digitado fica na caixa; só no sucesso a edição fecha e o indicador muda.
   */
  async salvarLista(p: Participante): Promise<void> {
    this.erroLista.set("");
    try {
      await gravarLista(db, p.nome, this.textoEdicao);
      this.listas.set(await lerListas(db));
      this.editando.set(null);
    } catch (e) {
      const erro = e as Error & { linha?: number };
      this.erroLista.set(mensagemDeErro(erro.message, "sortear", erro.linha));
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

  tituloDaLista(): string {
    const resumo = resumoDeEnvio(this.enviadas());
    return `Links do sorteio (${this.links().length}) - ${this.sorteadoEm()}${resumo ? ` - ${resumo}` : ""}`;
  }

  /**
   * O toque em "Enviar pelo WhatsApp" abre a conversa (o link segue o caminho normal) e já marca
   * a mensagem como enviada. Quem tocou e não enviou pode usar "Desfazer".
   */
  async enviarPeloWhatsApp(l: LinkDaTela): Promise<void> {
    if (l.status === "enviada") return;
    this.erro.set("");
    try {
      await marcarEnviada(db, { participanteId: l.participanteId, token: l.token, whatsapp: l.numero, texto: l.texto });
      await this.carregarLinks();
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message));
    }
  }

  /** Volta a mensagem para pendente; desfazer a única enviada pede confirmação. */
  async desfazer(l: LinkDaTela): Promise<void> {
    this.erro.set("");
    if (
      this.enviadas() === 1 &&
      !confirm("Esta é a única mensagem enviada. Desfazer solta a trava e deixa sortear e importar de novo. Continuar?")
    )
      return;
    try {
      await desfazerEnvio(db, l.participanteId);
      await this.carregarLinks();
    } catch (e) {
      this.erro.set(mensagemDeErro((e as Error).message));
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
