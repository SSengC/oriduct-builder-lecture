const generateBtn = document.getElementById("generate-btn");
const numbersContainer = document.getElementById("numbers-display");
const gameSelect = document.getElementById("game-select");
const themeBtn = document.getElementById("theme-btn");
const body = document.body;

// 테마 토글 기능
if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDarkMode = body.classList.contains("dark-mode");
        themeBtn.textContent = isDarkMode ? "☀️ 라이트 모드" : "🌙 다크 모드";
        
        // 디스커스 댓글 테마 업데이트를 위해 리셋
        if (typeof DISQUS !== 'undefined') {
            DISQUS.reset({ reload: true });
        }
        
        // 로컬 스토리지에 테마 저장
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });

    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        themeBtn.textContent = "🌙 다크 모드";
    }
}

// 공 생성 함수
function createBall(number, isSpecial = false) {
  const ball = document.createElement("div");
  ball.classList.add("number-ball");
  if (isSpecial) ball.classList.add("special");
  ball.textContent = number;
  return ball;
}

// 게임 로직
const games = {
  lotto: () => {
    const numbers = new Set();
    while (numbers.size < 6) numbers.add(Math.floor(Math.random() * 45) + 1);
    return Array.from(numbers).sort((a, b) => a - b).map(n => ({ val: n, special: false }));
  },
  pension: () => {
    const group = Math.floor(Math.random() * 5) + 1;
    const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
    return [{ val: `${group}조`, special: true }, ...digits.map(d => ({ val: d, special: false }))];
  },
  spitfire: () => Array.from({ length: 6 }, () => ({ val: Math.floor(Math.random() * 10) + 1, special: Math.random() > 0.8 })),
  powerball: () => {
    const numbers = new Set();
    while (numbers.size < 5) numbers.add(Math.floor(Math.random() * 69) + 1);
    const sorted = Array.from(numbers).sort((a, b) => a - b).map(n => ({ val: n, special: false }));
    sorted.push({ val: Math.floor(Math.random() * 26) + 1, special: true });
    return sorted;
  },
  random: () => Array.from({ length: 5 }, () => ({ val: Math.floor(Math.random() * 100) + 1, special: false }))
};

if (generateBtn && numbersContainer && gameSelect) {
    generateBtn.addEventListener("click", () => {
      numbersContainer.innerHTML = "";
      const result = games[gameSelect.value]();
      result.forEach((item, index) => {
        setTimeout(() => {
          numbersContainer.appendChild(createBall(item.val, item.special));
        }, index * 100);
      });

      // 재미있는 멘트 추가
      const messages = ["오늘 기운이 아주 좋습니다! 🍀", "대박의 기운이 느껴지네요! ✨", "행운은 준비된 자에게 옵니다. 💎", "재미로만 즐겨주세요! 😊"];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setTimeout(() => {
          const msgDiv = document.createElement("p");
          msgDiv.style.color = "var(--accent-color)";
          msgDiv.style.fontWeight = "bold";
          msgDiv.style.marginTop = "15px";
          msgDiv.style.textAlign = "center";
          msgDiv.innerText = randomMessage;
          numbersContainer.parentElement.appendChild(msgDiv);
          setTimeout(() => msgDiv.remove(), 3000);
      }, 1000);
    });
}

// --- AI 동물상 테스트 로직 ---
const ANIMAL_MODEL_URL = "https://teachablemachine.withgoogle.com/models/QOia7UN3H/";
let animalModel, animalLabelContainer, maxPredictions;

async function loadAnimalModel() {
    if (!animalModel) {
        const modelURL = ANIMAL_MODEL_URL + "model.json";
        const metadataURL = ANIMAL_MODEL_URL + "metadata.json";
        animalModel = await tmImage.load(modelURL, metadataURL);
        maxPredictions = animalModel.getTotalClasses();
    }
}

function setupLabels() {
    animalLabelContainer = document.getElementById("label-container");
    if (!animalLabelContainer) return;
    animalLabelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const barContainer = document.createElement("div");
        barContainer.classList.add("prediction-bar-container");
        barContainer.innerHTML = `
            <div class="label-text"></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill"></div></div>
        `;
        animalLabelContainer.appendChild(barContainer);
    }
}

// 이 함수는 HTML의 onchange에서 호출됨
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const labelContainer = document.getElementById("label-container");
    if (labelContainer) {
        labelContainer.innerHTML = "<p style='text-align:center;'>🤖 AI 모델을 불러오고 분석 중입니다... 잠시만 기다려주세요.</p>";
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = document.getElementById("uploaded-image");
        if (img) {
            img.src = e.target.result;
            img.style.display = "block";
            
            await loadAnimalModel();
            setupLabels();
            
            img.onload = async () => {
                await predict(img);
            };
        }
    };
    reader.readAsDataURL(file);
}

async function predict(imageElement) {
    const prediction = await animalModel.predict(imageElement);
    let topAnimal = "";
    let maxProb = 0;

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        
        if (prediction[i].probability > maxProb) {
            maxProb = prediction[i].probability;
            topAnimal = className;
        }

        const isDog = className.toLowerCase().includes("dog") || className.includes("강아지");
        const displayName = isDog ? "🐶 강아지상" : "🐱 고양이상";

        if (animalLabelContainer && animalLabelContainer.childNodes[i]) {
            const barContainer = animalLabelContainer.childNodes[i];
            barContainer.querySelector(".label-text").innerText = `${displayName}: ${probability}%`;
            barContainer.querySelector(".progress-bar-fill").style.width = probability + "%";
        }
    }

    displayCompliment(topAnimal);
}

function displayCompliment(animal) {
    const complimentBox = document.getElementById("result-compliment");
    if (!complimentBox) return;
    complimentBox.style.display = "block";
    complimentBox.style.backgroundColor = body.classList.contains("dark-mode") ? "#2d2d2d" : "#f8f9fa";
    complimentBox.style.border = "1px solid var(--border-color)";
    
    const isDog = animal.toLowerCase().includes("dog") || animal.includes("강아지");

    if (isDog) {
        complimentBox.innerHTML = `
            <h4 style="color: var(--accent-color); margin-top: 0;">당신은 보는 사람도 기분 좋게 만드는 '🐶 강아지상' 이시군요!</h4>
            <p>친절하고 상냥한 인상으로 주변 사람들에게 항상 사랑받는 스타일입니다. 웃을 때 가장 매력적이며, 사람들을 끌어당기는 긍정적인 에너지를 가지고 계시네요. 멍뭉미 넘치는 당신의 매력은 정말 독보적입니다! ✨</p>
        `;
    } else {
        complimentBox.innerHTML = `
            <h4 style="color: var(--accent-color); margin-top: 0;">당신은 도도하고 치명적인 매력의 '🐱 고양이상' 이시군요!</h4>
            <p>신비롭고 세련된 분위기를 가진 당신은 가만히 있어도 카리스마가 느껴지는 매력적인 인상입니다. 차가워 보일 수 있지만 알면 알수록 깊은 매력이 느껴지는 스타일이시네요. 당신만의 독특한 분위기가 정말 아름답습니다! 💎</p>
        `;
    }
}
