const generateBtn = document.getElementById("generate-btn");
const numbersContainer = document.getElementById("numbers-display");
const gameSelect = document.getElementById("game-select");
const themeBtn = document.getElementById("theme-btn");
const body = document.body;

// 테마 토글 기능
themeBtn.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  if (body.classList.contains("dark-mode")) {
    themeBtn.textContent = "☀️ 라이트 모드";
  } else {
    themeBtn.textContent = "🌙 다크 모드";
  }
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
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    return Array.from(numbers).sort((a, b) => a - b).map(n => ({ val: n, special: false }));
  },
  pension: () => {
    const group = Math.floor(Math.random() * 5) + 1;
    const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
    return [
      { val: `${group}조`, special: true },
      ...digits.map(d => ({ val: d, special: false }))
    ];
  },
  spitfire: () => {
    // 스피또 2000: 6개의 숫자 (1~10)
    return Array.from({ length: 6 }, () => ({ 
      val: Math.floor(Math.random() * 10) + 1, 
      special: Math.random() > 0.8 
    }));
  },
  powerball: () => {
    const numbers = new Set();
    while (numbers.size < 5) {
      numbers.add(Math.floor(Math.random() * 69) + 1);
    }
    const sorted = Array.from(numbers).sort((a, b) => a - b).map(n => ({ val: n, special: false }));
    const powerball = Math.floor(Math.random() * 26) + 1;
    sorted.push({ val: powerball, special: true });
    return sorted;
  },
  random: () => {
    return Array.from({ length: 5 }, () => ({ 
      val: Math.floor(Math.random() * 100) + 1, 
      special: false 
    }));
  }
};

generateBtn.addEventListener("click", () => {
  numbersContainer.innerHTML = "";
  const gameType = gameSelect.value;
  const result = games[gameType]();

  result.forEach((item, index) => {
    setTimeout(() => {
      const ball = createBall(item.val, item.special);
      numbersContainer.appendChild(ball);
  });
});

// --- AI 동물상 테스트 로직 ---
const ANIMAL_MODEL_URL = "https://teachablemachine.withgoogle.com/models/QOia7UN3H/";
let animalModel, webcam, animalLabelContainer, maxPredictions;

async function initAnimalModel() {
    const startBtn = document.getElementById("start-cam-btn");
    startBtn.textContent = "모델 로딩 중...";
    startBtn.disabled = true;

    const modelURL = ANIMAL_MODEL_URL + "model.json";
    const metadataURL = ANIMAL_MODEL_URL + "metadata.json";

    try {
        animalModel = await tmImage.load(modelURL, metadataURL);
        maxPredictions = animalModel.getTotalClasses();

        const flip = true; 
        webcam = new tmImage.Webcam(250, 250, flip); 
        await webcam.setup(); 
        await webcam.play();
        window.requestAnimationFrame(animalLoop);

        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        animalLabelContainer = document.getElementById("label-container");
        animalLabelContainer.innerHTML = "";
        for (let i = 0; i < maxPredictions; i++) {
            const barContainer = document.createElement("div");
            barContainer.classList.add("prediction-bar-container");
            barContainer.innerHTML = `
                <div class="label-text"></div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill"></div>
                </div>
            `;
            animalLabelContainer.appendChild(barContainer);
        }
        startBtn.style.display = "none";
    } catch (e) {
        console.error(e);
        alert("카메라 권한을 허용해주세요!");
        startBtn.textContent = "테스트 시작하기";
        startBtn.disabled = false;
    }
}

async function animalLoop() {
    webcam.update(); 
    await predictAnimal();
    window.requestAnimationFrame(animalLoop);
}

async function predictAnimal() {
    const prediction = await animalModel.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100).toFixed(0);
        
        const barContainer = animalLabelContainer.childNodes[i];
        barContainer.querySelector(".label-text").innerText = `${className === "Dog" ? "🐶 강아지상" : "🐱 고양이상"}: ${probability}%`;
        barContainer.querySelector(".progress-bar-fill").style.width = probability + "%";
    }
}
