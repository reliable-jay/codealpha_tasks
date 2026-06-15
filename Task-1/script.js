/* ============================================================
       SECTION A — COLLECT ALL PHOTO DATA FROM THE HTML
       We read every .gallery-card and pull out its data so
       JavaScript has a single list of all photos to work with.
    ============================================================ */

// querySelectorAll returns a NodeList. We spread it into
// a real array so we can use .map(), .filter(), etc.
const allCards = [...document.querySelectorAll(".gallery-card")];

// Build a plain object for each photo
const photos = allCards.map(function (card) {
  return {
    index: parseInt(card.dataset.index), // number e.g. 0
    category: card.dataset.category, // e.g. "mountains"
    src: card.querySelector("img").src, // full image URL
    alt: card.querySelector("img").alt, // alt text
    title: card.querySelector("h3").textContent, // e.g. "Dolomite Peaks"
    location: card.querySelector("p").textContent, // e.g. "Mountains · Italy"
  };
});

/* ============================================================
       SECTION B — FILTER STATE
       We track which category is active and which photos are visible.
    ============================================================ */

let activeFilter = "all"; // the currently selected category
let visiblePhotos = [...photos]; // photos that match the active filter

/* ============================================================
       SECTION C — FILTER LOGIC
       Called every time the user clicks a filter button.
    ============================================================ */

const filterBtns = document.querySelectorAll(".filter-btn");
const countDisplay = document.getElementById("count");

function applyFilter(chosenFilter) {
  // 1. Remember what's active
  activeFilter = chosenFilter;

  // 2. Work out which photos match
  if (chosenFilter === "all") {
    visiblePhotos = [...photos]; // all photos
  } else {
    visiblePhotos = photos.filter(function (photo) {
      return photo.category === chosenFilter;
    });
  }

  // 3. Show/hide each card in the DOM
  let showCount = 0; // we use this to stagger the animations

  allCards.forEach(function (card) {
    const matches =
      chosenFilter === "all" || card.dataset.category === chosenFilter;

    if (matches) {
      showCount++;
      card.classList.remove("hidden");

      // Reset animation so cards "fly in" again each time
      card.classList.remove("visible");

      // setTimeout staggers each card by 60ms more than the last
      // showCount * 60 means card 1 → 60ms, card 2 → 120ms, etc.
      const delay = showCount * 60;
      setTimeout(function () {
        card.classList.add("visible");
      }, delay);
    } else {
      // Hide cards that don't match
      card.classList.add("hidden");
      card.classList.remove("visible");
    }
  });

  // 4. Update the photo count in the header
  countDisplay.textContent = visiblePhotos.length;

  // 5. Update which button looks "active"
  filterBtns.forEach(function (btn) {
    if (btn.dataset.filter === chosenFilter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Attach click listeners to every filter button
filterBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    applyFilter(btn.dataset.filter); // pass the button's data-filter value
  });
});

/* ============================================================
       SECTION D — LIGHTBOX STATE
       We track which photo is open and whether the lightbox is visible.
    ============================================================ */

let lightboxOpen = false;
let currentIndex = 0;

// Grab all the lightbox DOM elements we need to update
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbCounter = document.getElementById("lb-counter");
const lbTitle = document.getElementById("lb-title");
const lbLocation = document.getElementById("lb-location");
const lbClose = document.getElementById("lb-close");
const lbPrev = document.getElementById("lb-prev");
const lbNext = document.getElementById("lb-next");

/* ============================================================
       SECTION E — LIGHTBOX FUNCTIONS
    ============================================================ */

// openLightbox: show the lightbox for a specific photo
function openLightbox(photoIndex) {
  // Find this photo's position in the visiblePhotos array
  const positionInVisible = visiblePhotos.findIndex(function (p) {
    return p.index === photoIndex;
  });

  // If it's not in the visible list, do nothing
  if (positionInVisible === -1) return;

  currentIndex = positionInVisible;

  // Show the photo data (no animation on first open)
  showPhoto(false);

  // Make the lightbox visible
  lightbox.classList.add("open");
  lightboxOpen = true;

  // Prevent the page behind from scrolling
  document.body.style.overflow = "hidden";

  // Move keyboard focus to the close button (accessibility)
  lbClose.focus();
}

// closeLightbox: hide the lightbox
function closeLightbox() {
  lightbox.classList.remove("open");
  lightboxOpen = false;
  document.body.style.overflow = ""; // restore scrolling
}

// showPhoto: update the image, title, counter, etc.
// animate = true adds a quick fade when switching between images
function showPhoto(animate) {
  const photo = visiblePhotos[currentIndex];
  if (!photo) return;

  if (animate) {
    // Step 1: fade the image out
    lbImg.classList.add("swapping");

    // Step 2: after 200ms, swap the image and fade back in
    setTimeout(function () {
      lbImg.src = photo.src;
      lbImg.alt = photo.alt;
      lbTitle.textContent = photo.title;
      lbLocation.textContent = photo.location;
      lbCounter.textContent = currentIndex + 1 + " / " + visiblePhotos.length;
      lbImg.classList.remove("swapping"); // fade back in
    }, 200);
  } else {
    // No animation — just set values directly
    lbImg.src = photo.src;
    lbImg.alt = photo.alt;
    lbTitle.textContent = photo.title;
    lbLocation.textContent = photo.location;
    lbCounter.textContent = currentIndex + 1 + " / " + visiblePhotos.length;
  }
}

// navigate: move to the next or previous photo
// direction is +1 (next) or -1 (prev)
function navigate(direction) {
  const total = visiblePhotos.length;
  // The % operator wraps around:
  //   if currentIndex is 0 and direction is -1 → goes to last
  //   if currentIndex is last and direction is +1 → goes to 0
  currentIndex = (currentIndex + direction + total) % total;
  showPhoto(true); // true = animate the transition
}

/* ============================================================
       SECTION F — EVENT LISTENERS (wiring everything together)
    ============================================================ */

// 1. Open lightbox when a gallery card is clicked
document.getElementById("gallery-grid").addEventListener("click", function (e) {
  // e.target is the element that was clicked.
  // .closest() walks up the DOM to find the nearest .gallery-card
  const card = e.target.closest(".gallery-card");
  if (!card) return; // clicked on empty grid area — do nothing

  const photoIndex = parseInt(card.dataset.index);
  openLightbox(photoIndex);
});

// 2. Also open on Enter or Space key (keyboard accessibility)
document
  .getElementById("gallery-grid")
  .addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".gallery-card");
    if (!card) return;
    e.preventDefault(); // stop Space from scrolling the page
    openLightbox(parseInt(card.dataset.index));
  });

// 3. Lightbox: close button
lbClose.addEventListener("click", closeLightbox);

// 4. Lightbox: prev button
lbPrev.addEventListener("click", function () {
  navigate(-1);
});

// 5. Lightbox: next button
lbNext.addEventListener("click", function () {
  navigate(+1);
});

// 6. Lightbox: click the dark backdrop to close
//    (but NOT when clicking the image or buttons)
lightbox.addEventListener("click", function (e) {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// 7. Keyboard shortcuts when lightbox is open
document.addEventListener("keydown", function (e) {
  if (!lightboxOpen) return; // ignore if lightbox is closed

  if (e.key === "ArrowRight") navigate(+1);
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "Escape") closeLightbox();
});

/* ============================================================
       SECTION G — ENTRANCE ANIMATION ON PAGE LOAD
       IntersectionObserver watches each card and adds .visible
       when it enters the viewport. This is more efficient than
       using a scroll event listener.
    ============================================================ */

const observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Card is now visible in the viewport — show it
        entry.target.classList.add("visible");
        // Stop watching this card (we only want to animate once)
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1, // trigger when 10% of the card is visible
  },
);

// Set a stagger delay on each card, then observe it
allCards.forEach(function (card, index) {
  card.style.transitionDelay = index * 0.05 + "s"; // 0s, 0.05s, 0.1s, ...
  observer.observe(card);
});
