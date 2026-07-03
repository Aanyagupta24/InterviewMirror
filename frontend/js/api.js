const startButtons = document.querySelectorAll("a");

startButtons.forEach(button => {
  if (button.textContent.includes("Start Practicing")) {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      try {
        const response = await fetch("http://localhost:5000/api/start");

        const data = await response.json();

        console.log(data);

        window.location.href = "interview-room.html";
      } catch (err) {
        alert("Backend not running!");
        console.error(err);
      }
    });
  }
});