/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GIT IDENTITY

Vastuut:

- tunnistaa Git-ympäristön
- lukee branch tiedon
- lukee viimeisimmän commitin
- tarkistaa muutokset

Ei:
- tee committeja
- pushaa
- pullaa
- muuta repositoryä

=====================================
*/


import {
  execSync,
} from "child_process"





function runGitCommand(
  command,
){

  try {

    return execSync(
      command,
      {
        encoding:"utf-8",
      },
    )
      .trim()


  } catch {

    return null

  }

}





function getGitIdentity(){

  const branch =
    runGitCommand(
      "git branch --show-current"
    )



  const commit =
    runGitCommand(
      "git rev-parse --short HEAD"
    )



  const status =
    runGitCommand(
      "git status --short"
    )



  return {

    repository:
      "Wood-Booster-HQ",


    branch:
      branch ||
      "unknown",


    commit:
      commit ||
      "unknown",


    state:
      status
        ? "changes"
        : "clean",


    changedFiles:
      status
        ? status.split("\n").length
        : 0,


    checkedAt:
      new Date()
        .toISOString(),

  }

}





export {

  getGitIdentity,

}
