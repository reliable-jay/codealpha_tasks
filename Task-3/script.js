const menuBtn = document.getElementById("menu-btn");
const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

/* --- Clear form after successful submission --- */

const form = document.getElementById("contact-form");

form.addEventListener("submit", () => {
  setTimeout(() => {
    form.reset();
  }, 1000);
});
