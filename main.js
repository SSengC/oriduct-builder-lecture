const generateBtn = document.getElementById("generate-btn");
const lottoNumbersContainer = document.querySelector(".lotto-numbers");

generateBtn.addEventListener("click", () => {
  lottoNumbersContainer.innerHTML = "";
  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }

  numbers.forEach((number) => {
    const lottoNumber = document.createElement("div");
    lottoNumber.classList.add("lotto-number");
    lottoNumber.textContent = number;
    lottoNumbersContainer.appendChild(lottoNumber);
  });
});
