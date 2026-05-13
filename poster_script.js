// 1. Referências dos elementos DOM
const imageUpload = document.getElementById('imageUpload');
const scaleInput = document.getElementById('scaleInput');
const edgeMode = document.getElementById('edgeMode');
const generateBtn = document.getElementById('generateBtn');
const previewImage = document.getElementById('previewImage');
const gridOverlay = document.getElementById('gridOverlay');
const statusText = document.getElementById('status');
const scaleLabel = document.getElementById('scaleLabel');
const scaleHelp = document.getElementById('scaleHelp');

let originalImage = new Image();
let imageLoaded = false;
let isPortrait = false; // Controla se a imagem é vertical

// Dimensões do A4
const A4_SHORT_MM = 210;
const A4_LONG_MM = 297;
const A4_SHORT_PX = 794;
const A4_LONG_PX = 1123;

// 2. Carregar a Imagem do Usuário
imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage.src = event.target.result;
        previewImage.src = event.target.result;
        
        originalImage.onload = () => {
            imageLoaded = true;
            
            // Verifica a orientação da imagem
            isPortrait = originalImage.height > originalImage.width;
            
            if (isPortrait) {
                scaleLabel.innerText = "2. Altura (em páginas A4)";
                scaleHelp.innerText = "Sua imagem é vertical. Defina a quantidade de páginas de altura.";
            } else {
                scaleLabel.innerText = "2. Largura (em páginas A4)";
                scaleHelp.innerText = "Sua imagem é horizontal. Defina a quantidade de páginas de largura.";
            }

            previewImage.style.display = 'block';
            generateBtn.disabled = false;
            updatePreviewGrid();
        };
    };
    reader.readAsDataURL(file);
});

// Atualizar o preview quando mudar configurações
scaleInput.addEventListener('input', updatePreviewGrid);

// 3. Atualizar a Grade do Preview Visual
function updatePreviewGrid() {
    if (!imageLoaded) return;

    const userInput = parseInt(scaleInput.value) || 1;
    let pagesWide, pagesHigh;
    const imageRatio = originalImage.width / originalImage.height;

    // Define as proporções do papel baseado na orientação da imagem
    const a4WidthMM = isPortrait ? A4_SHORT_MM : A4_LONG_MM;
    const a4HeightMM = isPortrait ? A4_LONG_MM : A4_SHORT_MM;

    // Calcula a grade
    if (isPortrait) {
        pagesHigh = userInput;
        const totalHeightA4 = pagesHigh * a4HeightMM; 
        const totalWidthA4 = totalHeightA4 * imageRatio;
        pagesWide = Math.ceil(totalWidthA4 / a4WidthMM);
    } else {
        pagesWide = userInput;
        const totalWidthA4 = pagesWide * a4WidthMM; 
        const totalHeightA4 = totalWidthA4 / imageRatio;
        pagesHigh = Math.ceil(totalHeightA4 / a4HeightMM);
    }

    gridOverlay.innerHTML = '';
    gridOverlay.style.gridTemplateColumns = `repeat(${pagesWide}, 1fr)`;
    gridOverlay.style.gridTemplateRows = `repeat(${pagesHigh}, 1fr)`;

    const totalCells = pagesWide * pagesHigh;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        gridOverlay.appendChild(cell);
    }
}

// 4. Botão de Gerar PDF
generateBtn.addEventListener('click', async () => {
    statusText.innerText = "Processando imagens... Aguarde.";
    generateBtn.disabled = true;

    setTimeout(() => {
        try {
            gerarPDF();
            statusText.innerText = "PDF gerado com sucesso! Verifique seus downloads.";
        } catch (error) {
            console.error(error);
            statusText.innerText = "Erro ao gerar PDF.";
        }
        generateBtn.disabled = false;
    }, 100);
});

// 5. Função que faz a matemática pesada e cria o PDF
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    
    // Variáveis dinâmicas para virar a folha A4 junto com a imagem
    const a4WidthMM = isPortrait ? A4_SHORT_MM : A4_LONG_MM;
    const a4HeightMM = isPortrait ? A4_LONG_MM : A4_SHORT_MM;
    const a4WidthPx = isPortrait ? A4_SHORT_PX : A4_LONG_PX;
    const a4HeightPx = isPortrait ? A4_LONG_PX : A4_SHORT_PX;
    const pdfOrientation = isPortrait ? 'portrait' : 'landscape';
    const a4Ratio = a4WidthMM / a4HeightMM;

    // Inicia o PDF com a orientação correta
    const pdf = new jsPDF({ orientation: pdfOrientation, unit: 'mm', format: 'a4' });

    const userInput = parseInt(scaleInput.value);
    const mode = edgeMode.value;

    let pagesWide, pagesHigh, sourceWidthPerPage, sourceHeightPerPage;

    if (isPortrait) {
        pagesHigh = userInput;
        sourceHeightPerPage = originalImage.height / pagesHigh;
        sourceWidthPerPage = sourceHeightPerPage * a4Ratio;
        pagesWide = Math.ceil(originalImage.width / sourceWidthPerPage);
    } else {
        pagesWide = userInput;
        sourceWidthPerPage = originalImage.width / pagesWide;
        sourceHeightPerPage = sourceWidthPerPage / a4Ratio;
        pagesHigh = Math.ceil(originalImage.height / sourceHeightPerPage);
    }

    const overlapMarginX = mode === 'overlap' ? sourceWidthPerPage * 0.05 : 0;
    const overlapMarginY = mode === 'overlap' ? sourceHeightPerPage * 0.05 : 0;

    let isFirstPage = true;

    for (let row = 0; row < pagesHigh; row++) {
        for (let col = 0; col < pagesWide; col++) {
            
            const canvas = document.createElement('canvas');
            canvas.width = a4WidthPx;
            canvas.height = a4HeightPx;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let sx = (col * sourceWidthPerPage) - overlapMarginX;
            let sy = (row * sourceHeightPerPage) - overlapMarginY;
            let sWidth = sourceWidthPerPage + (overlapMarginX * 2);
            let sHeight = sourceHeightPerPage + (overlapMarginY * 2);

            if (sx < 0) { sWidth += sx; sx = 0; }
            if (sy < 0) { sHeight += sy; sy = 0; }
            if (sx + sWidth > originalImage.width) { sWidth = originalImage.width - sx; }
            if (sy + sHeight > originalImage.height) { sHeight = originalImage.height - sy; }

            ctx.drawImage(originalImage, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            if (mode === 'crop') {
                desenharMarcasDeCorte(ctx, canvas.width, canvas.height);
            }

            if (!isFirstPage) pdf.addPage();
            
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            // Insere a imagem no tamanho da folha virada
            pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMM, a4HeightMM);
            
            isFirstPage = false;
        }
    }

    pdf.save('poster-dividido.pdf');
}

// 6. Função auxiliar das Marcas de Corte
function desenharMarcasDeCorte(ctx, width, height) {
    const size = 30; // tamanho da linha
    const offset = 10; // distância da borda
    
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    const desenharCruz = (x, y) => {
        ctx.beginPath();
        ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
        ctx.stroke();
    };

    desenharCruz(offset, offset);
    desenharCruz(width - offset, offset);
    desenharCruz(offset, height - offset);
    desenharCruz(width - offset, height - offset);
}