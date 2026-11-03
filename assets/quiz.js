// Shared quiz widget. Markup contract:
// <div class="quiz">
//   <p class="quiz-question">...</p>
//   <div class="quiz-options">
//     <button class="quiz-option" data-correct="false">...</button>
//     <button class="quiz-option" data-correct="true">...</button>
//     ...
//   </div>
//   <p class="quiz-feedback" data-correct-text="..." data-wrong-text="..."></p>
// </div>
(function () {
  function initQuiz(quiz) {
    const options = quiz.querySelectorAll(".quiz-option");
    const feedback = quiz.querySelector(".quiz-feedback");

    options.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quiz.dataset.answered === "true") return;
        quiz.dataset.answered = "true";

        const isCorrect = btn.dataset.correct === "true";
        options.forEach((opt) => {
          opt.disabled = true;
          if (opt.dataset.correct === "true") {
            opt.classList.add("quiz-correct");
          } else if (opt === btn) {
            opt.classList.add("quiz-wrong");
          }
        });

        if (feedback) {
          feedback.textContent = isCorrect
            ? feedback.dataset.correctText || "Right."
            : feedback.dataset.wrongText || "Not quite — see the highlighted answer.";
          feedback.classList.add(isCorrect ? "quiz-feedback-correct" : "quiz-feedback-wrong");
          feedback.hidden = false;
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz").forEach(initQuiz);
  });
})();
