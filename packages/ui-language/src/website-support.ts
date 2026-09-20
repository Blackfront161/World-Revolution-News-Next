import type { UiLanguage } from './index';

type WelcomeCopy = Readonly<{
  title: string;
  body: string;
  thanks: string;
  continue: string;
  support: string;
  external: string;
}>;
const copy: Record<UiLanguage, WelcomeCopy> = {
  de: {
    title: 'Kostenlos für alle. Gemeinsam getragen.',
    body: 'World Revolution News ist kostenlos. Freiwillige Spenden helfen uns, die laufenden Betriebskosten zu finanzieren. Wenn du möchtest und es dir leisten kannst, unterstütze unser Projekt oder die unabhängigen Quellen, deren Arbeit du hier liest.',
    thanks:
      'Es gibt keine Zahlungspflicht. Alle Inhalte bleiben auch ohne Spende zugänglich. Danke, dass du hier bist!',
    continue: 'Weiterlesen',
    support: 'Projekt freiwillig unterstützen',
    external:
      'Öffnet PayPal in einem neuen Tab. Erst beim Anklicken wird der Zahlungsanbieter aufgerufen.',
  },
  en: {
    title: 'Free for everyone. Supported together.',
    body: 'World Revolution News is free. Voluntary donations help cover our running costs. If you wish and can afford it, support our project or the independent sources whose work you read here.',
    thanks:
      'There is no obligation to pay. All content remains accessible without a donation. Thank you for being here!',
    continue: 'Continue reading',
    support: 'Support the project voluntarily',
    external: 'Opens PayPal in a new tab. The payment provider is contacted only when you click.',
  },
  es: {
    title: 'Gratis para todos. Con apoyo colectivo.',
    body: 'World Revolution News es gratuito. Las donaciones voluntarias ayudan a cubrir los gastos de funcionamiento. Si quieres y puedes permitírtelo, apoya nuestro proyecto o las fuentes independientes que lees aquí.',
    thanks:
      'No hay obligación de pagar. Todo el contenido sigue disponible sin donar. ¡Gracias por estar aquí!',
    continue: 'Seguir leyendo',
    support: 'Apoyar voluntariamente el proyecto',
    external:
      'Abre PayPal en otra pestaña. Solo se contacta con el proveedor de pagos al hacer clic.',
  },
  fr: {
    title: 'Gratuit pour tous. Soutenu ensemble.',
    body: 'World Revolution News est gratuit. Les dons volontaires contribuent aux frais de fonctionnement. Si vous le souhaitez et en avez les moyens, soutenez notre projet ou les sources indépendantes que vous lisez ici.',
    thanks:
      'Aucun paiement obligatoire. Tous les contenus restent accessibles sans don. Merci de votre présence !',
    continue: 'Continuer la lecture',
    support: 'Soutenir librement le projet',
    external:
      'Ouvre PayPal dans un nouvel onglet. Le prestataire de paiement est contacté uniquement après votre clic.',
  },
  it: {
    title: 'Gratuito per tutti. Sostenuto insieme.',
    body: 'World Revolution News è gratuito. Le donazioni volontarie aiutano a coprire i costi di gestione. Se lo desideri e puoi permettertelo, sostieni il progetto o le fonti indipendenti che leggi qui.',
    thanks:
      'Non è obbligatorio pagare. Tutti i contenuti restano accessibili senza donare. Grazie di essere qui!',
    continue: 'Continua a leggere',
    support: 'Sostieni volontariamente il progetto',
    external:
      'Apre PayPal in una nuova scheda. Il fornitore di pagamento viene contattato solo al clic.',
  },
  pt: {
    title: 'Gratuito para todos. Apoiado em conjunto.',
    body: 'World Revolution News é gratuito. Os donativos voluntários ajudam a cobrir os custos de funcionamento. Se quiseres e puderes, apoia o projeto ou as fontes independentes que lês aqui.',
    thanks:
      'Não há obrigação de pagar. Todos os conteúdos continuam acessíveis sem donativo. Obrigado por estares aqui!',
    continue: 'Continuar a ler',
    support: 'Apoiar voluntariamente o projeto',
    external:
      'Abre o PayPal num novo separador. O serviço de pagamento só é contactado quando clicas.',
  },
  ru: {
    title: 'Бесплатно для всех. При общей поддержке.',
    body: 'World Revolution News бесплатен. Добровольные пожертвования помогают покрывать текущие расходы. Если вы хотите и можете себе это позволить, поддержите наш проект или независимые источники, которые читаете здесь.',
    thanks:
      'Платить не обязательно. Все материалы доступны и без пожертвований. Спасибо, что вы с нами!',
    continue: 'Продолжить чтение',
    support: 'Добровольно поддержать проект',
    external:
      'Открывает PayPal в новой вкладке. Обращение к платёжному сервису происходит только после нажатия.',
  },
  el: {
    title: 'Δωρεάν για όλους. Με κοινή στήριξη.',
    body: 'Το World Revolution News είναι δωρεάν. Οι προαιρετικές δωρεές βοηθούν στην κάλυψη των λειτουργικών εξόδων. Αν θέλεις και έχεις τη δυνατότητα, στήριξε το έργο μας ή τις ανεξάρτητες πηγές που διαβάζεις εδώ.',
    thanks:
      'Δεν υπάρχει υποχρέωση πληρωμής. Όλο το περιεχόμενο παραμένει διαθέσιμο χωρίς δωρεά. Ευχαριστούμε που είσαι εδώ!',
    continue: 'Συνέχεια στην ανάγνωση',
    support: 'Προαιρετική στήριξη του έργου',
    external:
      'Ανοίγει το PayPal σε νέα καρτέλα. Η υπηρεσία πληρωμών καλείται μόνο όταν πατήσεις τον σύνδεσμο.',
  },
  tr: {
    title: 'Herkes için ücretsiz. Birlikte destekleniyor.',
    body: 'World Revolution News ücretsizdir. Gönüllü bağışlar işletme giderlerini karşılamamıza yardımcı olur. İstersen ve bütçen uygunsa projemizi veya burada okuduğun bağımsız kaynakları destekleyebilirsin.',
    thanks:
      'Ödeme zorunluluğu yoktur. Bağış yapmadan da tüm içeriklere erişebilirsin. Burada olduğun için teşekkürler!',
    continue: 'Okumaya devam et',
    support: 'Projeyi gönüllü olarak destekle',
    external:
      'PayPal yeni sekmede açılır. Ödeme sağlayıcısına yalnızca tıkladığında bağlantı kurulur.',
  },
};
export const getWebsiteSupportCopy = (language: UiLanguage): WelcomeCopy => copy[language];
