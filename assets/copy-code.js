// Copy button for code snippets. Include with <script src="../assets/copy-code.js"></script>.
// Every <pre> that holds a <code> gets a "Copy" button in its top-right corner.
// - A code block copies its whole text.
// - A transcript (<pre class="transcript">) shows a program's output, so it copies only the commands:
//   the lines that start with "$ ", without the "$ ". A transcript with no such line gets no button.
(function () {
  function textToCopy(pre) {
    const code = pre.querySelector("code");
    const text = code.textContent;
    if (!pre.classList.contains("transcript")) return text.replace(/\n$/, "");
    return text
      .split("\n")
      .filter((line) => line.startsWith("$ "))
      .map((line) => line.slice(2))
      .join("\n");
  }

  // Clipboard API where it is available (secure contexts), a hidden textarea and execCommand elsewhere, such as file:// pages.
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        area.remove();
      }
    });
  }

  function addButton(pre) {
    if (!pre.querySelector("code") || pre.parentElement.classList.contains("code-block")) return;
    const isTranscript = pre.classList.contains("transcript");
    if (isTranscript && !textToCopy(pre)) return;

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const label = isTranscript ? "Copy commands" : "Copy";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", label + " to the clipboard");
    wrapper.appendChild(button);

    let timer;
    const show = (text, state) => {
      button.textContent = text;
      button.dataset.state = state;
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.textContent = "Copy";
        delete button.dataset.state;
      }, 1500);
    };

    button.addEventListener("click", () => {
      copy(textToCopy(pre)).then(
        () => show("Copied", "done"),
        () => show("Press Ctrl+C", "failed"),
      );
    });
  }

  document.querySelectorAll("pre").forEach(addButton);
})();
