// Função para carregar o Google Analytics APENAS se o usuário aceitar
function loadGoogleAnalytics() {
    const gaCode = 'G-D2ZP3SHR0C'; 

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaCode}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', gaCode);
}

// Lógica de verificação e criação do Banner
document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem("metricTools_cookieConsent");

    if (consent === "accepted") {
        loadGoogleAnalytics();
    } else if (!consent) {
        // Cria o HTML do banner dinamicamente se o usuário ainda não escolheu
        const banner = document.createElement("div");
        banner.id = "cookieBanner";
        banner.className = "cookie-banner";
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Nós usamos cookies para analisar o tráfego e melhorar a sua experiência em nossas ferramentas. Ao continuar navegando, você concorda com a nossa política.</p>
                <div class="cookie-buttons">
                    <button id="btnRecusar" class="btn-cookie btn-recusar">Recusar</button>
                    <button id="btnAceitar" class="btn-cookie btn-aceitar">Aceitar</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Ações dos botões
        document.getElementById("btnAceitar").addEventListener("click", () => {
            localStorage.setItem("metricTools_cookieConsent", "accepted");
            document.getElementById("cookieBanner").style.display = "none";
            loadGoogleAnalytics(); // Carrega o GA na mesma hora
        });

        document.getElementById("btnRecusar").addEventListener("click", () => {
            localStorage.setItem("metricTools_cookieConsent", "rejected");
            document.getElementById("cookieBanner").style.display = "none";
            // Não carrega o GA, mantendo a privacidade total
        });
    }
});