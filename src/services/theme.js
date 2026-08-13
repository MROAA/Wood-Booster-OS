const STORAGE_KEY = "wb-theme"


function getTheme() {

  if (typeof localStorage === "undefined") {

    return "dark"

  }

  return (
    localStorage.getItem(STORAGE_KEY) ||
    "dark"
  )

}


function applyTheme(theme) {

  document.documentElement.dataset.theme = theme

}


function setTheme(theme) {

  localStorage.setItem(STORAGE_KEY, theme)

  applyTheme(theme)

}


function initTheme() {

  applyTheme(getTheme())

}


export {
  getTheme,
  setTheme,
  applyTheme,
  initTheme,
}
