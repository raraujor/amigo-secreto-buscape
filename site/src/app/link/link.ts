import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { type EstadoDaPaginaDoLink, estadoDaPaginaDoLink } from "../../../../comum/pagina-link";
import { lerLink } from "../dados/repositorio";
import { db } from "../firebase";

@Component({
  selector: "app-link",
  styles: `
    :host { display: block; min-height: 100vh; position: relative; overflow: hidden;
      background: radial-gradient(circle at 50% 0%, #1f6b4a 0%, #0f3d2c 55%, #0a2a1f 100%); }
    .neve { position: absolute; top: -1.5rem; color: #fff; opacity: .85; pointer-events: none;
      animation: cair linear infinite; user-select: none; }
    @keyframes cair { to { transform: translateY(105vh) rotate(180deg); } }
    .palco { position: relative; max-width: 26rem; margin: 0 auto; padding: 2.5rem 1.25rem 3rem; text-align: center; }
    .guirlanda { font-size: 2rem; letter-spacing: .4rem; margin-bottom: .5rem; }
    .cartao { background: #fffaf0; color: #3b2a1a; border-radius: 1.25rem; padding: 1.75rem 1.5rem;
      border: 3px solid #d4a017; box-shadow: 0 .75rem 2rem rgba(0,0,0,.35); }
    .cartao.pop { animation: pop .6s cubic-bezier(.2,1.4,.4,1); }
    @keyframes pop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .titulo { font-family: Georgia, "Times New Roman", serif; font-size: 1.7rem; margin: .25rem 0 .75rem; color: #9b1c1c; }
    .presente { font-size: 4rem; line-height: 1; margin: .5rem 0; animation: balanco 2.4s ease-in-out infinite; }
    @keyframes balanco { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
    .frase { font-size: 1.05rem; line-height: 1.5; margin: .5rem 0 1.25rem; }
    .resultado { font-family: Georgia, "Times New Roman", serif; font-size: 1.35rem; margin: .5rem 0;
      color: #14532d; }
    .amigo { display: block; font-size: 2.2rem; font-weight: 700; color: #b91c1c; margin-top: .35rem;
      word-break: break-word; }
    .botao { font: inherit; font-size: 1.15rem; font-weight: 600; padding: .9rem 1.6rem; border: 0;
      border-radius: 999px; color: #fff; cursor: pointer;
      background: linear-gradient(#d62828, #9b1c1c); box-shadow: 0 .3rem 0 #6b1212; }
    .botao:active { transform: translateY(.15rem); box-shadow: 0 .15rem 0 #6b1212; }
    .encontro { margin-top: 1.25rem; padding: 1rem; background: #f3ecd9; border-radius: .75rem;
      text-align: left; font-size: .98rem; line-height: 1.7; }
    .segredo { margin-top: 1.25rem; font-size: .95rem; color: #6b5a47; }
    .erro { color: #9b1c1c; }
    .rodape { margin-top: 1.25rem; color: #e8f5ec; font-size: .95rem; }
    @media (prefers-reduced-motion: reduce) {
      .neve, .presente, .cartao.pop { animation: none; }
    }
  `,
  template: `
    @for (f of flocos; track $index) {
      <span class="neve" aria-hidden="true"
        [style.left.%]="f.x" [style.animation-duration.s]="f.duracao" [style.animation-delay.s]="f.atraso"
        [style.font-size.rem]="f.tamanho">❄</span>
    }
    <div class="palco">
      <div class="guirlanda" aria-hidden="true">🎄 ⭐ 🎄</div>
      @if (carregando()) {
        <div class="cartao"><p class="frase">Preparando o seu embrulho…</p></div>
      } @else {
        @switch (estado().tipo) {
          @case ("invalido") {
            <div class="cartao">
              <div class="presente" aria-hidden="true">🎁</div>
              <h1 class="titulo">Ops!</h1>
              <p class="frase erro">{{ texto() }}</p>
              <p class="segredo">Confira se o link foi copiado inteiro.</p>
            </div>
          }
          @case ("fechado") {
            <div class="cartao">
              <h1 class="titulo">{{ texto() }}</h1>
              <div class="presente" aria-hidden="true">🎁</div>
              <p class="frase">Ho ho ho! 🎅<br />O seu amigo secreto está esperando, bem embrulhado.<br />
                Toque no botão e descubra quem é!</p>
              <button type="button" class="botao" (click)="revelar()">Ver quem eu tirei</button>
              <p class="segredo">🤫 É segredo! Mostre esta tela só para você.</p>
            </div>
          }
          @case ("aberto") {
            <div class="cartao pop">
              <h1 class="titulo">Ho ho ho! 🎅</h1>
              <p class="resultado">{{ textoAberto().antes }}<span class="amigo">{{ textoAberto().amigo }}</span></p>
              <p class="frase">Capriche no presente e guarde segredo até o grande dia.<br />
                Que o Natal da família seja cheio de amor e alegria! ✨</p>
              @if (encontro(); as e) {
                <div class="encontro">
                  <strong>🎄 O encontro</strong><br />
                  📅 {{ e.data }}<br />📍 {{ e.local }}<br />💰 Valor sugerido: {{ e.valor }}
                </div>
              }
              <p class="segredo">🤫 Pode fechar esta página. O seu link continua valendo.</p>
            </div>
          }
        }
      }
      <p class="rodape">Feliz Natal! 🎄</p>
    </div>
  `,
})
export class Link implements OnInit {
  readonly carregando = signal(true);
  readonly estado = signal<EstadoDaPaginaDoLink>({ tipo: "invalido", texto: "" });
  readonly encontro = signal<{ data: string; local: string; valor: string } | null>(null);
  /** Flocos de neve: posição, tamanho e ritmo variados, calculados uma vez. */
  readonly flocos = Array.from({ length: 22 }, (_, i) => ({
    x: (i * 4.7 + (i % 3) * 3) % 98,
    duracao: 9 + ((i * 7) % 9),
    atraso: -((i * 5) % 14),
    tamanho: 0.7 + ((i * 3) % 7) / 10,
  }));
  private link: { participante: string; amigo: string } | null = null;
  private token = "";

  constructor(private readonly rota: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    this.token = this.rota.snapshot.paramMap.get("token") ?? "";
    this.link = await lerLink(db, this.token).catch(() => null);
    this.estado.set(estadoDaPaginaDoLink(this.link, false));
    this.carregando.set(false);
  }

  texto(): string {
    const e = this.estado();
    return e.tipo === "fechado" ? e.titulo : e.texto;
  }

  /** "Ana, você tirou: Bruno" separado em duas partes para destacar o nome do amigo. */
  textoAberto(): { antes: string; amigo: string } {
    const e = this.estado();
    const texto = e.tipo === "aberto" ? e.texto : "";
    const corte = texto.indexOf(": ");
    return corte < 0 ? { antes: texto, amigo: "" } : { antes: texto.slice(0, corte + 1), amigo: texto.slice(corte + 2) };
  }

  async revelar(): Promise<void> {
    this.estado.set(estadoDaPaginaDoLink(this.link, true));
    const dados = await getDoc(doc(db, "config", "encontro")).catch(() => null);
    if (dados?.exists()) this.encontro.set(dados.data() as { data: string; local: string; valor: string });
    // O resultado aparece mesmo que o registro da abertura falhe (FR-011).
    await updateDoc(doc(db, "links", this.token), { abertoEm: serverTimestamp() }).catch(() => undefined);
  }
}
