import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { type EstadoDaPaginaDoLink, estadoDaPaginaDoLink } from "../../../../comum/pagina-link";
import { lerLink } from "../dados/repositorio";
import { db } from "../firebase";

@Component({
  selector: "app-link",
  template: `
    @if (carregando()) {
      <p>Carregando…</p>
    } @else {
      @switch (estado().tipo) {
        @case ("invalido") { <h1 class="erro">{{ texto() }}</h1> }
        @case ("fechado") {
          <h1>{{ texto() }}</h1>
          <button type="button" (click)="revelar()">Ver quem eu tirei</button>
        }
        @case ("aberto") {
          <p class="destaque">{{ texto() }}</p>
          @if (encontro(); as e) {
            <p>Data: {{ e.data }}<br />Local: {{ e.local }}<br />Valor sugerido: {{ e.valor }}</p>
          }
        }
      }
    }
  `,
})
export class Link implements OnInit {
  readonly carregando = signal(true);
  readonly estado = signal<EstadoDaPaginaDoLink>({ tipo: "invalido", texto: "" });
  readonly encontro = signal<{ data: string; local: string; valor: string } | null>(null);
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

  async revelar(): Promise<void> {
    this.estado.set(estadoDaPaginaDoLink(this.link, true));
    const dados = await getDoc(doc(db, "config", "encontro")).catch(() => null);
    if (dados?.exists()) this.encontro.set(dados.data() as { data: string; local: string; valor: string });
    // O resultado aparece mesmo que o registro da abertura falhe (FR-011).
    await updateDoc(doc(db, "links", this.token), { abertoEm: serverTimestamp() }).catch(() => undefined);
  }
}
