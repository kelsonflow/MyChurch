import type { Content, Settings } from "./model";
import { homeDefaults } from "./home-sections";
export const defaultSettings: Settings = {
  name: "Assembleia de Deus — Missão aos Povos",
  email: "",
  phone: "",
  address: "",
  schedule: "",
  map: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  youtube: "",
  logo: "",
  seoDescription:
    "Uma igreja que ama, cuida e partilha. Conheça a Assembleia de Deus — Missão aos Povos, em Portugal.",
  contactTitle: "Vamos conversar?",
  contactText: "Uma pergunta, um pedido de oração ou simplesmente um olá.",
  tagline: "Fé que nos une. Amor que nos move.",
  confirmed: false,
};
const make = (
  kind: Content["kind"],
  slug: string,
  title: string,
  data: Content["data"],
): Content => ({
  id: slug,
  kind,
  slug,
  title,
  status: "published",
  data: { demo: true, ...data },
  updated_at: "2026-11-17T12:00:00Z",
  ...(kind === "event"
    ? { starts_at: `${data.start}:00Z`, ends_at: `${data.end}:00Z` }
    : {}),
});
export const demoContent: Content[] = [
  make("page", "inicio", "Uma igreja que ama, cuida e partilha.", {
    homeSections: homeDefaults,
    eyebrow: "FÉ QUE NOS UNE. AMOR QUE NOS MOVE.",
    subtitle:
      "Um lugar para crescer na fé, encontrar comunidade e caminhar com propósito.",
    body: "Acreditamos que a fé se vive em comunidade. De portas abertas e com o coração disponível, queremos caminhar consigo.",
    image: "/images/worship.webp",
  }),
  make("page", "a-igreja", "A fé aproxima-nos. O amor faz-nos família.", {
    eyebrow: "A NOSSA COMUNIDADE",
    subtitle:
      "Somos a Igreja Assembleia de Deus — Missão aos Povos, em Portugal.",
    body: "A oração, o ensino da Bíblia e o cuidado com as pessoas fazem parte da identidade apresentada pela igreja no seu site institucional.",
    image: "/images/community.webp",
    sections: [
      {
        title: "A nossa missão",
        body: "Partilhar a fé em Jesus Cristo, cuidar das pessoas e servir a comunidade. Texto editorial de demonstração, sujeito a aprovação.",
      },
      {
        title: "A nossa visão",
        body: "Ser uma comunidade acolhedora onde cada pessoa encontra espaço para crescer e servir. Texto editorial de demonstração.",
      },
      {
        title: "O que valorizamos",
        body: "Fé, oração, ensino bíblico, comunhão e serviço. Conteúdo a validar pela igreja.",
      },
      {
        title: "Uma história de missão",
        body: "Segundo o site institucional, o trabalho missionário em Portugal começou em 2008, na Tapada das Mercês. A cronologia completa será validada pela igreja.",
      },
      {
        title: "Liderança",
        body: "Os nomes, funções e fotografias da liderança serão publicados após confirmação pela igreja.",
      },
    ],
  }),
  make("page", "primeira-visita", "Há um lugar para si.", {
    eyebrow: "A SUA PRIMEIRA VISITA",
    subtitle: "Venha como está. Será um gosto recebê-lo.",
    body: "Não precisa de conhecer os cânticos nem de ter todas as respostas. Pode acompanhar, ouvir e conhecer a comunidade ao seu ritmo.",
    image: "/images/community.webp",
    sections: [
      {
        title: "O que acontece num culto?",
        body: "Oração, cânticos e uma mensagem bíblica fazem parte da vivência cristã. O formato e a duração dos encontros serão confirmados pela equipa.",
      },
      {
        title: "Posso levar os meus filhos?",
        body: "As informações sobre acolhimento de crianças e atividades por idade aguardam confirmação. Contacte a equipa antes da visita.",
      },
      {
        title: "O espaço é acessível?",
        body: "Os detalhes sobre acessibilidade, estacionamento e transportes serão publicados após verificação.",
      },
      {
        title: "Preciso de me inscrever?",
        body: "As condições de participação serão confirmadas para cada encontro. Consulte a agenda ou contacte a igreja.",
      },
    ],
  }),
  make("page", "privacidade", "Política de privacidade", {
    eyebrow: "INFORMAÇÃO LEGAL",
    body: "MINUTA — requer validação da organização antes do lançamento.\n\nEste site recebe os dados que introduz no formulário para responder ao seu pedido. Não envie dados sensíveis ou informações sobre terceiros.\n\nA identidade e o contacto do responsável pelo tratamento, fundamento jurídico, prazo de conservação, destinatários e eventuais transferências internacionais devem ser preenchidos pela igreja.\n\nPode solicitar acesso, retificação ou apagamento dos seus dados através do contacto institucional, a confirmar. Pode apresentar reclamação à CNPD.\n\nOs cookies de sessão são usados exclusivamente na área privada. Os vídeos do YouTube só são carregados após uma escolha explícita. Não se utilizam ferramentas de análise.\n\nFornecedores técnicos previstos: alojamento da aplicação, Supabase e serviço de email, sujeitos a validação contratual e de localização dos dados.",
  }),
  make("page", "termos", "Termos de utilização", {
    eyebrow: "INFORMAÇÃO LEGAL",
    body: "MINUTA — requer validação pela igreja.\n\nOs conteúdos deste site destinam-se a dar a conhecer a comunidade e as suas atividades. Os direitos sobre textos, marca e fotografias pertencem aos respetivos titulares.\n\nAs fotografias históricas foram obtidas no site institucional adportugal.pt. A autorização de publicação e o consentimento das pessoas retratadas devem ser confirmados antes do lançamento.\n\nEventos, horários e contactos assinalados como demonstração não representam informação confirmada.",
  }),
  ...[
    {
      slug: "ensino-biblico",
      title: "Ensino bíblico",
      body: "Crescer no conhecimento da Palavra e descobrir como vivê-la no dia a dia.",
    },
    {
      slug: "jovens",
      title: "Jovens",
      body: "Um espaço para partilhar perguntas, construir amizades e crescer na fé.",
    },
    {
      slug: "criancas",
      title: "Crianças",
      body: "Aprender, descobrir e crescer num ambiente de cuidado.",
    },
    {
      slug: "oracao",
      title: "Oração",
      body: "Encontramo-nos na oração, no cuidado e na esperança.",
    },
    {
      slug: "louvor",
      title: "Louvor",
      body: "Servir a comunidade através da música e da adoração.",
    },
    {
      slug: "apoio-social",
      title: "Apoio social",
      body: "Traduzir o amor em gestos concretos de cuidado e serviço.",
    },
  ].map((m) =>
    make("ministry", m.slug, m.title, {
      body: m.body,
      subtitle:
        "Apresentação de demonstração. Atividades e horários sujeitos a confirmação.",
      image: "/images/community.webp",
    }),
  ),
  make("event", "encontro-de-comunidade-demo", "À mesa, em comunidade", {
    category: "Comunidade",
    start: "2026-12-12T16:00",
    end: "2026-12-12T18:00",
    eventState: "scheduled",
    location: "Local a confirmar — demonstração",
    body: "Evento de demonstração para apresentar a agenda. Não é uma atividade anunciada pela igreja.",
    image: "/images/community.webp",
  }),
  make("event", "celebracao-demo", "Celebrar a esperança", {
    category: "Celebração",
    start: "2026-12-20T10:00",
    end: "2026-12-20T12:00",
    eventState: "scheduled",
    location: "Local a confirmar — demonstração",
    body: "Conteúdo de demonstração. Data, horário e local sem validade institucional.",
    image: "/images/worship.webp",
  }),
  make("album", "a-nossa-comunidade", "Momentos que nos aproximam", {
    body: "Fotografias históricas do site institucional, publicadas em 2023. Não representam a programação atual.",
    images: [
      {
        image: "/images/community.webp",
        alt: "Fachada da igreja em Portugal, numa fotografia histórica",
        caption: "Arquivo institucional · 2023",
      },
      {
        image: "/images/worship.webp",
        alt: "Celebração de Santa Ceia, no arquivo institucional de junho de 2023",
        caption: "Arquivo institucional · junho de 2023",
      },
    ],
  }),
];
