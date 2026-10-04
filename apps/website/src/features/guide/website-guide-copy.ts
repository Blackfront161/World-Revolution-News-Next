import type { UiLanguage } from '@wrn/ui-language';
export const websiteAtlasGuideCopy: Record<UiLanguage, string> = {
  de: 'Öffne den Atlas über das Punk-Icon im Kopf der Seite. Wähle Sprache und Theme; nach dem Start füllt die Karte den Bildschirm. Die Musik schaltest du im Atlas selbst ein. Der Atlas lädt separat und braucht Internet.',
  en: 'Open the Atlas using the punk icon in the page header. Choose a language and theme; after starting, the map fills the screen. Turn on music inside the Atlas. The Atlas loads separately and needs internet.',
  es: 'Abre el Atlas con el icono punk de la cabecera. Elige idioma y tema; al iniciar, el mapa ocupa la pantalla. Activa la música dentro del Atlas. El Atlas carga por separado y necesita internet.',
  fr: 'Ouvre l’Atlas avec l’icône punk en haut de la page. Choisis la langue et le thème ; au démarrage, la carte remplit l’écran. Active la musique dans l’Atlas. L’Atlas charge séparément et nécessite internet.',
  it: 'Apri l’Atlas dall’icona punk nell’intestazione. Scegli lingua e tema; dopo l’avvio la mappa riempie lo schermo. Attiva la musica nell’Atlas. L’Atlas si carica separatamente e richiede internet.',
  pt: 'Abre o Atlas pelo ícone punk no cabeçalho. Escolhe idioma e tema; ao iniciar, o mapa ocupa o ecrã. Ativa a música no Atlas. O Atlas carrega separadamente e precisa de internet.',
  ru: 'Открой Атлас через панк-значок вверху страницы. Выбери язык и тему; после запуска карта занимает экран. Музыку включай в Атласе. Атлас загружается отдельно и требует интернет.',
  el: 'Άνοιξε τον Άτλαντα από το πανκ εικονίδιο στην κεφαλίδα. Επίλεξε γλώσσα και θέμα· μετά την εκκίνηση ο χάρτης γεμίζει την οθόνη. Ενεργοποίησε τη μουσική στον Άτλαντα. Ο Άτλας φορτώνεται χωριστά και χρειάζεται διαδίκτυο.',
  tr: 'Atlası sayfa başlığındaki punk simgesinden aç. Dil ve tema seç; başlattıktan sonra harita ekranı doldurur. Müziği Atlas içinde aç. Atlas ayrı yüklenir ve internet gerektirir.',
};
export const websiteGuideActions: Record<UiLanguage, readonly [string, string, string, string]> = {
  de: ['Schließen', 'Radio öffnen', 'Podcasts öffnen', 'Bibliothek öffnen'],
  en: ['Close', 'Open radio', 'Open podcasts', 'Open library'],
  es: ['Cerrar', 'Abrir radio', 'Abrir podcasts', 'Abrir biblioteca'],
  fr: ['Fermer', 'Ouvrir la radio', 'Ouvrir les podcasts', 'Ouvrir la bibliothèque'],
  it: ['Chiudi', 'Apri radio', 'Apri podcast', 'Apri biblioteca'],
  pt: ['Fechar', 'Abrir rádio', 'Abrir podcasts', 'Abrir biblioteca'],
  ru: ['Закрыть', 'Открыть радио', 'Открыть подкасты', 'Открыть библиотеку'],
  el: ['Κλείσιμο', 'Άνοιγμα ραδιοφώνου', 'Άνοιγμα podcasts', 'Άνοιγμα βιβλιοθήκης'],
  tr: ['Kapat', 'Radyoyu aç', 'Podcastleri aç', 'Kütüphaneyi aç'],
};
type GuideCopy = { title: string; intro: string; tasks: readonly (readonly [string, string])[] };
export const websiteGuideCopy: Record<UiLanguage, GuideCopy> = {
  de: {
    title: 'Website-Hilfe',
    intro: 'Inhalte finden, lesen, hören und teilen.',
    tasks: [
      [
        'Radio hören',
        'Unter Medien → Radio findest du Sender und ihre Originalseiten. Starte verfügbare Wiedergabe selbst. Nicht jeder Eintrag hat einen freigegebenen Stream; der Original-Link führt zum Anbieter.',
      ],
      [
        'Podcasts und Vorlesen',
        'Medien → Podcasts führt zu den Originalseiten der Folgen. Im Artikel kann die Gerätestimme vorhandenen Text lokal vorlesen. Das ist keine Folge des Anbieters. Externe Medien und neu erzeugte Hördateien brauchen eine Verbindung und verfügbare Dienste.',
      ],
      [
        'Inhalte teilen',
        'Teilen verwendet die interne Website-Adresse. Die Originalquelle bleibt erkennbar. Bei einer fertigen maschinellen Artikelübersetzung wird die übersetzte Überschrift mit „Übersetzt mit World Revolution News“ geteilt. Ohne native Teilen-Funktion kannst du den Link kopieren.',
      ],
      [
        'Übersetzen und Wartezeiten',
        'Wähle deine Sprache und öffne einen Artikel. Fremdsprachige Überschriften und freigegebene Volltexte werden automatisch übersetzt. WRN-Kurztexte haben eigene Sprachversionen. Gemeinsame Übersetzungen können wiederverwendet werden. Bei Fehlern bleibt das Original lesbar. Beachte angegebene Wartezeiten; unbekannte Kontingente werden nicht als verfügbar ausgewiesen.',
      ],
      [
        'Offline und Gespeichert',
        'Offline liest du zuletzt verfügbare Daten, keine neuen Nachrichten. Gespeichert merkt Artikel und lädt keine externen Audio-, Video- oder Buchdateien herunter. Neue Übersetzungen und Live-Radio brauchen Internet. Lokale Lesedaten lassen sich im Menü prüfen und löschen.',
      ],
      [
        'Fehler oder defekte Quelle melden',
        'Notiere Quelle, Original-Link, Zielsprache und Fehlermeldung. Das Feedbackformular ist in der WRN-App unter „Feedback & neue Quellen“ verfügbar. Diese Website-Hilfe sendet keine Meldung. Teile keine Passwörter oder privaten Kontaktadressen.',
      ],
    ],
  },
  en: {
    title: 'Website help',
    intro: 'Find, read, listen to and share content.',
    tasks: [
      [
        'Listen to radio',
        'Media → Radio lists stations and their original pages. Start available playback yourself. Not every listing has an admitted stream; the original link opens the provider’s page.',
      ],
      [
        'Podcasts and read aloud',
        'Media → Podcasts opens the original episode pages. The device voice can read available article text locally. This is not a publisher’s episode. External media and newly generated audio need a connection and available services.',
      ],
      [
        'Share content',
        'Share uses the internal Website address and retains the original source. Completed machine translations share the translated headline with “Translated with World Revolution News”. You can copy the link if native sharing is unavailable.',
      ],
      [
        'Translation and waiting',
        'Choose your language and open an article. Foreign headlines and admitted full texts are translated automatically. WRN notes have their own language versions. Shared translations can be reused. Errors leave the original readable. Observe stated retry times; unknown quotas are not shown as available.',
      ],
      [
        'Offline and saved content',
        'Offline means previously available data, not new news. Saved remembers articles without downloading external audio, video or book files. New translations and live radio need Internet. You can inspect and clear local reading data in the menu.',
      ],
      [
        'Report an error or broken source',
        'Note the source, original link, target language and error message. The WRN App provides “Feedback & new sources”. This Website help sends no report. Do not share passwords or private contact addresses.',
      ],
    ],
  },
  es: {
    title: 'Ayuda del sitio web',
    intro: 'Encuentra, lee, escucha y comparte contenidos.',
    tasks: [
      [
        'Escuchar radio',
        'Medios → Radio muestra emisoras y sus páginas originales. Inicia tú la reproducción disponible. No todas las entradas tienen una transmisión autorizada; el enlace original abre al proveedor.',
      ],
      [
        'Podcasts y lectura en voz alta',
        'Medios → Podcasts abre las páginas originales de los episodios. La voz del dispositivo puede leer localmente el texto disponible del artículo. No es un episodio del editor. Los medios externos y el audio recién generado necesitan conexión y servicios disponibles.',
      ],
      [
        'Compartir contenidos',
        'Compartir usa la dirección interna del sitio y conserva la fuente original. Una traducción automática terminada comparte el titular traducido con “Traducido con World Revolution News”. Si no puedes compartir de forma nativa, copia el enlace.',
      ],
      [
        'Traducción y espera',
        'Elige tu idioma y abre un artículo. Los titulares extranjeros y textos completos autorizados se traducen automáticamente. Los resúmenes WRN tienen versiones propias. Se pueden reutilizar traducciones compartidas. Si hay errores, el original sigue disponible. Respeta los tiempos de espera indicados; las cuotas desconocidas no se muestran como disponibles.',
      ],
      [
        'Sin conexión y guardados',
        'Sin conexión lees los últimos datos disponibles, no noticias nuevas. Guardar recuerda artículos sin descargar archivos externos de audio, vídeo o libros. Nuevas traducciones y radio en directo requieren Internet. Puedes revisar y borrar datos locales de lectura en el menú.',
      ],
      [
        'Informar de errores o fuentes rotas',
        'Anota fuente, enlace original, idioma de destino y mensaje de error. La app WRN ofrece “Comentarios y nuevas fuentes”. Esta ayuda no envía informes. No compartas contraseñas ni direcciones privadas de contacto.',
      ],
    ],
  },
  fr: {
    title: 'Aide du site web',
    intro: 'Trouver, lire, écouter et partager des contenus.',
    tasks: [
      [
        'Écouter la radio',
        'Médias → Radio présente les stations et leurs pages originales. Démarre toi-même la lecture disponible. Chaque entrée ne possède pas un flux autorisé ; le lien original ouvre la page du fournisseur.',
      ],
      [
        'Podcasts et lecture à voix haute',
        'Médias → Podcasts ouvre les pages originales des épisodes. La voix de l’appareil peut lire localement le texte disponible. Ce n’est pas un épisode de l’éditeur. Les médias externes et les nouveaux fichiers audio nécessitent une connexion et des services disponibles.',
      ],
      [
        'Partager des contenus',
        'Partager utilise l’adresse interne du site et conserve la source originale. Une traduction automatique terminée partage le titre traduit avec « Traduit avec World Revolution News ». Copie le lien si le partage natif est indisponible.',
      ],
      [
        'Traduction et attente',
        'Choisis ta langue et ouvre un article. Les titres étrangers et les textes complets autorisés sont traduits automatiquement. Les résumés WRN ont leurs propres versions. Les traductions partagées peuvent être réutilisées. En cas d’erreur, l’original reste lisible. Respecte les délais indiqués ; les quotas inconnus ne sont pas présentés comme disponibles.',
      ],
      [
        'Hors connexion et enregistrés',
        'Hors connexion, tu lis les dernières données disponibles, pas de nouvelles actualités. Enregistrer conserve les articles sans télécharger de fichiers externes audio, vidéo ou livres. Les nouvelles traductions et la radio en direct nécessitent Internet. Le menu permet de consulter et supprimer les données locales de lecture.',
      ],
      [
        'Signaler une erreur ou une source défectueuse',
        'Note la source, le lien original, la langue cible et le message d’erreur. L’app WRN propose « Commentaires et nouvelles sources ». Cette aide n’envoie aucun signalement. Ne partage aucun mot de passe ni adresse privée de contact.',
      ],
    ],
  },
  it: {
    title: 'Guida del sito web',
    intro: 'Trova, leggi, ascolta e condividi contenuti.',
    tasks: [
      [
        'Ascoltare la radio',
        'Media → Radio elenca stazioni e pagine originali. Avvia tu la riproduzione disponibile. Non tutte le voci hanno un flusso autorizzato; il link originale apre il fornitore.',
      ],
      [
        'Podcast e lettura ad alta voce',
        'Media → Podcast apre le pagine originali degli episodi. La voce del dispositivo può leggere localmente il testo disponibile. Non è un episodio dell’editore. I media esterni e i nuovi file audio richiedono connessione e servizi disponibili.',
      ],
      [
        'Condividere contenuti',
        'Condividi usa l’indirizzo interno del sito e mantiene la fonte originale. Una traduzione automatica completata condivide il titolo tradotto con “Tradotto con World Revolution News”. Copia il link se la condivisione nativa non è disponibile.',
      ],
      [
        'Traduzione e attesa',
        'Scegli la lingua e apri un articolo. Titoli stranieri e testi completi autorizzati vengono tradotti automaticamente. I riassunti WRN hanno versioni proprie. Le traduzioni condivise possono essere riutilizzate. In caso di errore l’originale resta leggibile. Rispetta le attese indicate; le quote sconosciute non risultano disponibili.',
      ],
      [
        'Offline e salvati',
        'Offline leggi gli ultimi dati disponibili, non nuove notizie. Salvare ricorda gli articoli senza scaricare file esterni audio, video o libri. Nuove traduzioni e radio dal vivo richiedono Internet. Puoi controllare ed eliminare i dati locali di lettura nel menu.',
      ],
      [
        'Segnalare errori o fonti non funzionanti',
        'Annota fonte, link originale, lingua di destinazione e messaggio di errore. L’app WRN offre “Feedback e nuove fonti”. Questa guida non invia segnalazioni. Non condividere password o indirizzi privati di contatto.',
      ],
    ],
  },
  pt: {
    title: 'Ajuda do site',
    intro: 'Encontra, lê, ouve e partilha conteúdos.',
    tasks: [
      [
        'Ouvir rádio',
        'Média → Rádio lista estações e páginas originais. Inicia tu a reprodução disponível. Nem todas as entradas têm uma transmissão autorizada; o link original abre o fornecedor.',
      ],
      [
        'Podcasts e leitura em voz alta',
        'Média → Podcasts abre as páginas originais dos episódios. A voz do dispositivo pode ler localmente o texto disponível. Não é um episódio do editor. Média externa e novos ficheiros de áudio precisam de ligação e serviços disponíveis.',
      ],
      [
        'Partilhar conteúdos',
        'Partilhar usa o endereço interno do site e mantém a fonte original. Uma tradução automática concluída partilha o título traduzido com “Traduzido com World Revolution News”. Copia o link se a partilha nativa não estiver disponível.',
      ],
      [
        'Tradução e espera',
        'Escolhe o idioma e abre um artigo. Títulos estrangeiros e textos completos autorizados são traduzidos automaticamente. Os resumos WRN têm versões próprias. As traduções partilhadas podem ser reutilizadas. Em caso de erro, o original continua legível. Respeita os tempos de espera indicados; quotas desconhecidas não são apresentadas como disponíveis.',
      ],
      [
        'Offline e guardados',
        'Offline lês os últimos dados disponíveis, não novas notícias. Guardar memoriza artigos sem descarregar ficheiros externos de áudio, vídeo ou livros. Novas traduções e rádio ao vivo precisam de Internet. O menu permite consultar e apagar dados locais de leitura.',
      ],
      [
        'Comunicar erros ou fontes avariadas',
        'Anota fonte, link original, idioma de destino e mensagem de erro. A app WRN oferece “Feedback e novas fontes”. Esta ajuda não envia relatórios. Não partilhes palavras-passe ou endereços privados de contacto.',
      ],
    ],
  },
  ru: {
    title: 'Помощь по сайту',
    intro: 'Находите, читайте, слушайте и делитесь материалами.',
    tasks: [
      [
        'Слушать радио',
        'Медиа → Радио содержит станции и их оригинальные страницы. Запускайте доступное воспроизведение сами. Не у каждой записи есть разрешённый поток; оригинальная ссылка открывает страницу поставщика.',
      ],
      [
        'Подкасты и чтение вслух',
        'Медиа → Подкасты открывает оригинальные страницы выпусков. Голос устройства может локально прочитать доступный текст статьи. Это не выпуск издателя. Внешние медиа и новые аудиофайлы требуют подключения и доступных служб.',
      ],
      [
        'Делиться материалами',
        'Поделиться использует внутренний адрес сайта и сохраняет оригинальный источник. Готовый машинный перевод делится переведённым заголовком с пометкой «Переведено с помощью World Revolution News». Если системная функция недоступна, скопируйте ссылку.',
      ],
      [
        'Перевод и ожидание',
        'Выберите язык и откройте статью. Иноязычные заголовки и разрешённые полные тексты переводятся автоматически. Заметки WRN имеют собственные языковые версии. Общие переводы могут использоваться повторно. При ошибке оригинал остаётся доступным. Соблюдайте указанные сроки ожидания; неизвестные квоты не обозначаются доступными.',
      ],
      [
        'Без сети и сохранённое',
        'Без сети доступны последние полученные данные, а не новые новости. Сохранение запоминает статьи без загрузки внешних аудио-, видео- или книжных файлов. Новые переводы и прямое радио требуют Интернета. Локальные данные чтения можно проверить и удалить в меню.',
      ],
      [
        'Сообщить об ошибке или недоступном источнике',
        'Запишите источник, оригинальную ссылку, целевой язык и сообщение об ошибке. В приложении WRN есть «Отзывы и новые источники». Эта помощь ничего не отправляет. Не делитесь паролями или личными контактными адресами.',
      ],
    ],
  },
  el: {
    title: 'Βοήθεια ιστοτόπου',
    intro: 'Βρες, διάβασε, άκουσε και μοιράσου περιεχόμενο.',
    tasks: [
      [
        'Ακρόαση ραδιοφώνου',
        'Πολυμέσα → Ραδιόφωνο περιλαμβάνει σταθμούς και πρωτότυπες σελίδες. Ξεκίνα μόνος σου τη διαθέσιμη αναπαραγωγή. Δεν διαθέτει κάθε καταχώριση εγκεκριμένη ροή· ο αρχικός σύνδεσμος ανοίγει τον πάροχο.',
      ],
      [
        'Podcasts και εκφώνηση',
        'Πολυμέσα → Podcasts ανοίγει τις πρωτότυπες σελίδες επεισοδίων. Η φωνή της συσκευής μπορεί να διαβάσει το διαθέσιμο κείμενο τοπικά. Δεν είναι επεισόδιο του εκδότη. Τα εξωτερικά πολυμέσα και τα νέα αρχεία ήχου χρειάζονται σύνδεση και διαθέσιμες υπηρεσίες.',
      ],
      [
        'Κοινή χρήση περιεχομένου',
        'Η κοινή χρήση χρησιμοποιεί την εσωτερική διεύθυνση του ιστοτόπου και διατηρεί την αρχική πηγή. Η ολοκληρωμένη αυτόματη μετάφραση μοιράζεται τον μεταφρασμένο τίτλο με «Μεταφράστηκε με το World Revolution News». Αν δεν υπάρχει εγγενής κοινή χρήση, αντέγραψε τον σύνδεσμο.',
      ],
      [
        'Μετάφραση και αναμονή',
        'Επίλεξε γλώσσα και άνοιξε άρθρο. Ξενόγλωσσοι τίτλοι και εγκεκριμένα πλήρη κείμενα μεταφράζονται αυτόματα. Οι σημειώσεις WRN έχουν δικές τους εκδόσεις. Οι κοινόχρηστες μεταφράσεις μπορούν να επαναχρησιμοποιηθούν. Σε σφάλμα το πρωτότυπο παραμένει αναγνώσιμο. Τήρησε τους χρόνους αναμονής· άγνωστα όρια δεν εμφανίζονται διαθέσιμα.',
      ],
      [
        'Εκτός σύνδεσης και αποθηκευμένα',
        'Εκτός σύνδεσης διαβάζεις τα τελευταία διαθέσιμα δεδομένα, όχι νέες ειδήσεις. Η αποθήκευση θυμάται άρθρα χωρίς λήψη εξωτερικών αρχείων ήχου, βίντεο ή βιβλίων. Νέες μεταφράσεις και ζωντανό ραδιόφωνο χρειάζονται Internet. Μπορείς να ελέγξεις και να διαγράψεις τοπικά δεδομένα ανάγνωσης από το μενού.',
      ],
      [
        'Αναφορά σφάλματος ή προβληματικής πηγής',
        'Σημείωσε πηγή, αρχικό σύνδεσμο, γλώσσα στόχο και μήνυμα σφάλματος. Η εφαρμογή WRN διαθέτει «Σχόλια και νέες πηγές». Αυτή η βοήθεια δεν αποστέλλει αναφορά. Μη μοιράζεσαι κωδικούς ή ιδιωτικές διευθύνσεις επικοινωνίας.',
      ],
    ],
  },
  tr: {
    title: 'Web sitesi yardımı',
    intro: 'İçerik bul, oku, dinle ve paylaş.',
    tasks: [
      [
        'Radyo dinleme',
        'Medya → Radyo istasyonları ve asıl sayfalarını listeler. Kullanılabilir oynatmayı kendin başlat. Her kaydın onaylanmış yayını yoktur; asıl bağlantı sağlayıcıyı açar.',
      ],
      [
        'Podcastler ve sesli okuma',
        'Medya → Podcastler bölümlerin asıl sayfalarını açar. Cihaz sesi kullanılabilir makale metnini yerel olarak okuyabilir. Bu, yayıncının bölümü değildir. Harici medya ve yeni oluşturulan ses dosyaları bağlantı ve kullanılabilir hizmetler gerektirir.',
      ],
      [
        'İçerik paylaşma',
        'Paylaş, sitenin dahili adresini kullanır ve asıl kaynağı korur. Tamamlanmış makine çevirisi, çevrilmiş başlığı “World Revolution News ile çevrildi” notuyla paylaşır. Yerel paylaşım yoksa bağlantıyı kopyala.',
      ],
      [
        'Çeviri ve bekleme',
        'Dilini seç ve makale aç. Yabancı dilde başlıklar ve onaylanmış tam metinler otomatik çevrilir. WRN notlarının kendi dil sürümleri vardır. Paylaşılan çeviriler yeniden kullanılabilir. Hata olursa asıl metin okunabilir kalır. Gösterilen bekleme süresine uy; bilinmeyen kotalar kullanılabilir gösterilmez.',
      ],
      [
        'Çevrimdışı ve kaydedilenler',
        'Çevrimdışı son alınan verileri okursun, yeni haberleri değil. Kaydet, harici ses, video veya kitap dosyalarını indirmeden makaleleri hatırlar. Yeni çeviriler ve canlı radyo Internet gerektirir. Yerel okuma verilerini menüden inceleyip silebilirsin.',
      ],
      [
        'Hata veya bozuk kaynak bildirme',
        'Kaynağı, asıl bağlantıyı, hedef dili ve hata mesajını not et. WRN uygulamasında “Geri bildirim ve yeni kaynaklar” vardır. Bu yardım bildirim göndermez. Parola veya özel iletişim adreslerini paylaşma.',
      ],
    ],
  },
};
