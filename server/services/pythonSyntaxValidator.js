import { execFile } from "node:child_process"

import { mkdtemp, rm, writeFile } from "node:fs/promises"

import { tmpdir } from "node:os"

import path from "node:path"

/*
 * Tarkistaa onko annettu teksti syntaktisesti kelvollista Pythonia
 * ajamalla `python3 -m py_compile` väliaikaiseen tiedostoon. Tämä on
 * tarpeen koska havaittu käsin, että pythonCodeDebugger.js/
 * pythonCodeRefactorer.js tuottavat joskus (~1/3 yrityksistä)
 * rikkinäistä koodia, jota pelkkä "ei ole tyhjä eikä placeholder"
 * -tarkistus ei havaitse - esim. puuttuva aloittava docstring-
 * lainausmerkki, joka näyttää muuten aivan kelvolliselta koodilta.
 * Ei koskaan aja itse koodia - vain kääntää sen tarkistaakseen
 * syntaksin, samaan tapaan kuin editorin "check syntax" -toiminto.
 */
export async function isValidPythonSyntax(code) {
  if (!code || !code.trim()) {
    return false
  }

  const dir = await mkdtemp(path.join(tmpdir(), "wb-py-syntax-"))
  const filePath = path.join(dir, "candidate.py")

  try {
    await writeFile(filePath, code, "utf-8")

    await new Promise((resolve, reject) => {
      execFile(
        "python3",
        ["-m", "py_compile", filePath],
        { timeout: 10000 },
        (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        },
      )
    })

    return true
  } catch {
    return false
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
