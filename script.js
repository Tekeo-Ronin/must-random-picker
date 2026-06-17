const form = document.querySelector("#picker-form");
const usernameInput = document.querySelector("#username-input");
const pickButton = document.querySelector("#pick-button");
const pickAnotherButton = document.querySelector("#pick-another-button");

const statusElement = document.querySelector("#status");
const movieCard = document.querySelector("#movie-card");
const moviePoster = document.querySelector("#movie-poster");
const posterPlaceholder = document.querySelector("#poster-placeholder");
const movieType = document.querySelector("#movie-type");
const movieTitle = document.querySelector("#movie-title");
const movieMeta = document.querySelector("#movie-meta");
const openMustLink = document.querySelector("#open-must-link");

let loadedUsername = "";
let loadedMovies = [];
let currentMovieId = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = extractUsername(usernameInput.value);

  if (!username) {
    showStatus("Please enter a valid Must username or profile link.");
    return;
  }

  try {
    setLoading(true);
    hideMovie();

    if (username !== loadedUsername || loadedMovies.length === 0) {
      showStatus("Loading your Must Want list...");
      loadedMovies = await loadMoviesFromWantList(username);
      loadedUsername = username;
    }

    pickRandomMovie();
  } catch (error) {
    console.error(error);

    showStatus(
      "Could not load this Must profile. The profile may be private, empty, unavailable, or blocked by browser CORS.",
    );
  } finally {
    setLoading(false);
  }
});

pickAnotherButton.addEventListener("click", () => {
  pickRandomMovie();
});

function extractUsername(input) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  if (value.includes("mustapp.com")) {
    const normalizedValue = value.startsWith("http")
      ? value
      : `https://${value}`;

    try {
      const url = new URL(normalizedValue);
      const parts = url.pathname.split("/").filter(Boolean);
      const profilePart = parts.find((part) => part.startsWith("@"));

      return profilePart ? profilePart.replace("@", "") : "";
    } catch {
      return "";
    }
  }

  return value.replace("@", "").trim();
}

async function loadMoviesFromWantList(username) {
  const user = await fetchJson(
    `https://mustapp.com/api/users/uri/${encodeURIComponent(username)}`,
  );

  const wantIds = user?.lists?.want;

  if (!Array.isArray(wantIds) || wantIds.length === 0) {
    throw new Error("Want list is empty or unavailable.");
  }

  const products = await loadProductsInBatches(wantIds);

  const movies = products.filter((product) => {
    return product && product.type === "movie";
  });

  if (movies.length === 0) {
    throw new Error("No movies found in Want list.");
  }

  return movies;
}

async function loadProductsInBatches(ids) {
  const batchSize = 100;
  const allProducts = [];

  for (let index = 0; index < ids.length; index += batchSize) {
    const batch = ids.slice(index, index + batchSize);

    const products = await fetchJson("https://mustapp.com/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: batch,
      }),
    });

    if (Array.isArray(products)) {
      allProducts.push(...products);
    }
  }

  return allProducts;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function pickRandomMovie() {
  if (loadedMovies.length === 0) {
    showStatus("No movies found.");
    return;
  }

  let movie = loadedMovies[Math.floor(Math.random() * loadedMovies.length)];

  if (loadedMovies.length > 1) {
    while (movie.id === currentMovieId) {
      movie = loadedMovies[Math.floor(Math.random() * loadedMovies.length)];
    }
  }

  currentMovieId = movie.id;
  renderMovie(movie);
}

function renderMovie(movie) {
  console.log("Selected movie:", movie);

  const title = movie.title || "Untitled";
  const releaseYear = getYear(movie.release_date);
  const runtime = formatRuntime(movie.runtime);
  const mustUrl = `https://mustapp.com/p/${movie.id}`;

  movieType.textContent = "Random movie";
  movieTitle.textContent = title;
  movieMeta.textContent = [releaseYear, runtime].filter(Boolean).join(" • ");
  openMustLink.href = mustUrl;

  renderPoster(movie, title);

  movieCard.classList.remove("hidden");
  showStatus("");
}

function renderPoster(movie, title) {
  const posterPath = getPosterPath(movie);
  const posterUrls = buildPosterUrls(posterPath);

  moviePoster.removeAttribute("src");
  moviePoster.style.display = "none";
  posterPlaceholder.style.display = "grid";

  if (posterUrls.length === 0) {
    return;
  }

  tryPosterUrl(posterUrls, 0, title);
}

function getPosterPath(movie) {
  return (
    movie.poster_file_path ||
    movie.poster_path ||
    movie.posterFilePath ||
    movie.posterPath ||
    movie.image_uri ||
    movie.imageUri ||
    movie.image ||
    movie.poster ||
    ""
  );
}

function buildPosterUrls(path) {
  if (!path) {
    return [];
  }

  const cleanPath = String(path).trim();

  if (!cleanPath) {
    return [];
  }

  if (cleanPath.startsWith("http")) {
    return [cleanPath];
  }

  if (cleanPath.startsWith("//")) {
    return [`https:${cleanPath}`];
  }

  if (cleanPath.startsWith("/")) {
    return [
      `https://image.tmdb.org/t/p/w500${cleanPath}`,
      `https://image.tmdb.org/t/p/original${cleanPath}`,
      `https://mustapp.com${cleanPath}`,
    ];
  }

  return [
    `https://image.tmdb.org/t/p/w500/${cleanPath}`,
    `https://image.tmdb.org/t/p/original/${cleanPath}`,
    `https://mustapp.com/${cleanPath}`,
  ];
}

function tryPosterUrl(urls, index, title) {
  if (index >= urls.length) {
    moviePoster.style.display = "none";
    posterPlaceholder.style.display = "grid";
    return;
  }

  const url = urls[index];

  moviePoster.onload = () => {
    moviePoster.style.display = "block";
    posterPlaceholder.style.display = "none";
  };

  moviePoster.onerror = () => {
    tryPosterUrl(urls, index + 1, title);
  };

  moviePoster.src = url;
  moviePoster.alt = `${title} poster`;
}

function getYear(dateString) {
  if (!dateString) {
    return "";
  }

  return String(dateString).slice(0, 4);
}

function formatRuntime(value) {
  const rawRuntime = Number(value);

  if (!Number.isFinite(rawRuntime) || rawRuntime <= 0) {
    return "";
  }

  let totalMinutes = rawRuntime;

  if (rawRuntime > 1000) {
    totalMinutes = Math.round(rawRuntime / 60);
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function showStatus(message) {
  statusElement.textContent = message;
}

function hideMovie() {
  movieCard.classList.add("hidden");
}

function setLoading(isLoading) {
  pickButton.disabled = isLoading;
  pickAnotherButton.disabled = isLoading;

  if (isLoading) {
    pickButton.textContent = "Loading...";
    return;
  }

  pickButton.textContent =
    loadedMovies.length > 0 ? "Pick another" : "Pick random movie";
}
