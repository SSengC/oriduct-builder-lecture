const generateBtn = document.getElementById("generate-btn");
const numbersContainer = document.getElementById("numbers-display");
const gameSelect = document.getElementById("game-select");
const themeBtn = document.getElementById("theme-btn");
const body = document.body;

// 탭 전환 기능
function showView(viewId) {
    document.getElementById('lotto-view').style.display = viewId === 'lotto-view' ? 'block' : 'none';
    document.getElementById('animal-view').style.display = viewId === 'animal-view' ? 'block' : 'none';
    
    // 버튼 활성화 스타일
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn.innerText.includes(viewId === 'lotto-view' ? '번호' : '동물상')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 테마 토글 기능
themeBtn.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  themeBtn.textContent = body.classList.contains("dark-mode") ? "☀️ 라이트 모드" : "🌙 다크 모드";
});

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

generateBtn.addEventListener("click", () => {
  numbersContainer.innerHTML = "";
  const result = games[gameSelect.value]();
  result.forEach((item, index) => {
    setTimeout(() => {
      numbersContainer.appendChild(createBall(item.val, item.special));
    }, index * 100);
  });
});

// --- AI 동물상 테스트 로직 ---
const ANIMAL_MODEL_URL = "https://teachablemachine.withgoogle.com/models/QOia7UN3H/";
let animalModel, webcam, animalLabelContainer, maxPredictions;
let isCamOn = false;

async function loadAnimalModel() {
    if (!animalModel) {
        const modelURL = ANIMAL_MODEL_URL + "model.json";
        const metadataURL = ANIMAL_MODEL_URL + "metadata.json";
        animalModel = await tmImage.load(modelURL, metadataURL);
        maxPredictions = animalModel.getTotalClasses();
    }
}

async function initAnimalModel() {
    const startBtn = document.getElementById("start-cam-btn");
    startBtn.textContent = "로딩 중...";
    await loadAnimalModel();

    try {
        const flip = true; 
        webcam = new tmImage.Webcam(300, 300, flip); 
        await webcam.setup(); 
        await webcam.play();
        isCamOn = true;
        window.requestAnimationFrame(animalLoop);

        document.getElementById("uploaded-image").style.display = "none";
        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        container.appendChild(webcam.canvas);
        
        setupLabels();
        startBtn.style.display = "none";
    } catch (e) {
        alert("카메라를 시작할 수 없습니다.");
        startBtn.textContent = "📷 카메라 사용";
    }
}

function setupLabels() {
    animalLabelContainer = document.getElementById("label-container");
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

async function animalLoop() {
    if (isCamOn) {
        webcam.update(); 
        await predict(webcam.canvas);
        window.requestAnimationFrame(animalLoop);
    }
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (isCamOn && webcam) {
        webcam.stop();
        isCamOn = false;
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("start-cam-btn").style.display = "inline-block";
        document.getElementById("start-cam-btn").textContent = "📷 카메라 사용";
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = document.getElementById("uploaded-image");
        img.src = e.target.result;
        img.style.display = "block";
        
        await loadAnimalModel();
        setupLabels();
        
        // 이미지가 로드된 후 예측 실행
        img.onload = async () => {
            await predict(img);
        };
    };
    reader.readAsDataURL(file);
}

async function predict(imageElement) {
    const prediction = await animalModel.predict(imageElement);
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        const barContainer = animalLabelContainer.childNodes[i];
        barContainer.querySelector(".label-text").innerText = `${className === "Dog" ? "🐶 강아지상" : "🐱 고양이상"}: ${probability}%`;
        barContainer.querySelector(".progress-bar-fill").style.width = probability + "%";
    }
}
