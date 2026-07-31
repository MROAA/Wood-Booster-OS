/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CAPABILITY PERMISSION LAYER V1

Vastuut:
- määrittelee kyvykkyyksien oikeustasot
- määrittelee toimintojen riskitasot
- kertoo, saako toiminnon suorittaa
- kertoo, tarvitaanko ihmisen hyväksyntä
- kertoo, tarvitaanko kirjautuminen
- estää rekisteröimättömät toiminnot
- tuottaa rakenteisen permission-tuloksen

Permission Layer ei:
- suorita toimintoja
- käytä API-avaimia
- avaa verkkosivuja
- kirjoita tiedostoja
- julkaise sisältöä
- kutsu kielimallia
=====================================
*/


const PERMISSION_LAYER_VERSION =
  "1.0.0"


const PERMISSION_LEVELS =
  Object.freeze({
    AUTONOMOUS:
      "autonomous",

    APPROVAL_REQUIRED:
      "approval_required",

    HUMAN_LOGIN_REQUIRED:
      "human_login_required",

    BLOCKED:
      "blocked",
  })


const RISK_LEVELS =
  Object.freeze({
    LOW:
      "low",

    MEDIUM:
      "medium",

    HIGH:
      "high",

    CRITICAL:
      "critical",
  })


const CAPABILITY_IDS =
  Object.freeze({
    CODE:
      "code",

    MOLTBOOK:
      "moltbook",

    X:
      "x",

    INSTAGRAM:
      "instagram",

    FACEBOOK:
      "facebook",

    BROWSER:
      "browser",

    CREDENTIALS:
      "credentials",

    SYSTEM:
      "system",
  })


const permissionRegistry =
  Object.freeze({
    code: {
      inspect_project: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee projektin rakennetta.",
      },

      read_file: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee sallitun työtilan tiedoston.",
      },

      search_code: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Etsii tietoa sallitusta koodityötilasta.",
      },

      propose_file: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo tiedostoehdotuksen muuttamatta levyä.",
      },

      create_patch: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.MEDIUM,

        reversible:
          true,

        description:
          "Luo tarkistettavan koodimuutoksen.",
      },

      write_file: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          true,

        description:
          "Kirjoittaa hyväksytyn tiedoston työtilaan.",
      },

      syntax_check: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Suorittaa sallitun syntaksitarkistuksen.",
      },

      run_tests: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.MEDIUM,

        reversible:
          true,

        description:
          "Suorittaa rekisteröidyn testikomennon.",
      },

      git_diff: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Näyttää nykyiset Git-muutokset.",
      },

      git_commit: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          true,

        description:
          "Luo hyväksytyn Git-commitin.",
      },

      delete_file: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Tiedoston poistaminen on estetty V1-versiossa.",
      },

      execute_shell_command: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Vapaa komentorivin suoritus on estetty.",
      },
    },

    credentials: {
      check_connection: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Tarkistaa palveluyhteyden tilan näyttämättä salaisuuksia.",
      },

      check_token_status: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Tarkistaa tokenin voimassaolon.",
      },

      refresh_token: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.MEDIUM,

        reversible:
          true,

        description:
          "Uusii tokenin automaattisesti, jos palvelu sallii sen.",
      },

      create_login_link: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo käyttäjälle turvallisen OAuth-kirjautumislinkin.",
      },

      complete_oauth_login: {
        permissionLevel:
          PERMISSION_LEVELS
            .HUMAN_LOGIN_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          true,

        description:
          "Palvelun ensimmäinen kirjautuminen vaatii käyttäjän hyväksynnän.",
      },

      read_secret_value: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Kielimalli ei saa lukea salaisuuden raakaa arvoa.",
      },

      expose_secret_in_chat: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Salaisuuksia ei saa näyttää chatissa.",
      },
    },

    moltbook: {
      read_feed: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee Moltbook-syötettä.",
      },

      create_post_draft: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo Moltbook-julkaisuluonnoksen.",
      },

      publish_post: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Julkaisee hyväksytyn Moltbook-julkaisun.",
      },
    },

    x: {
      read_posts: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee X-julkaisuja sallituilla käyttöoikeuksilla.",
      },

      create_post_draft: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo X-julkaisuluonnoksen.",
      },

      publish_post: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Julkaisee hyväksytyn X-julkaisun.",
      },
    },

    instagram: {
      read_comments: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee Instagram-kommentteja sallituilla oikeuksilla.",
      },

      create_post_draft: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo Instagram-julkaisuluonnoksen.",
      },

      publish_post: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Julkaisee hyväksytyn Instagram-julkaisun.",
      },
    },

    facebook: {
      read_page_comments: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Lukee Facebook-sivun kommentteja.",
      },

      create_page_post_draft: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Luo Facebook-sivun julkaisuluonnoksen.",
      },

      publish_page_post: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Julkaisee hyväksytyn Facebook-sivujulkaisun.",
      },
    },

    browser: {
      inspect_page: {
        permissionLevel:
          PERMISSION_LEVELS
            .AUTONOMOUS,

        riskLevel:
          RISK_LEVELS.LOW,

        reversible:
          true,

        description:
          "Tarkastelee sallittua verkkosivua.",
      },

      fill_form: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.MEDIUM,

        reversible:
          true,

        description:
          "Täyttää lomakkeen, mutta ei lähetä sitä automaattisesti.",
      },

      submit_form: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Lähettää hyväksytyn verkkolomakkeen.",
      },

      enter_password: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Kielimalli ei saa käsitellä käyttäjän salasanaa.",
      },
    },

    system: {
      install_package: {
        permissionLevel:
          PERMISSION_LEVELS
            .APPROVAL_REQUIRED,

        riskLevel:
          RISK_LEVELS.HIGH,

        reversible:
          false,

        description:
          "Ohjelmiston asennus vaatii käyttäjän hyväksynnän.",
      },

      use_sudo: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Autonominen sudo-käyttö on estetty.",
      },

      delete_directory: {
        permissionLevel:
          PERMISSION_LEVELS
            .BLOCKED,

        riskLevel:
          RISK_LEVELS.CRITICAL,

        reversible:
          false,

        description:
          "Hakemistojen autonominen poistaminen on estetty.",
      },
    },
  })


function normalizeIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}


function getCapabilityDefinition(
  capabilityId,
) {
  const normalizedCapabilityId =
    normalizeIdentifier(
      capabilityId,
    )

  return (
    permissionRegistry[
      normalizedCapabilityId
    ] ||
    null
  )
}


function getActionDefinition({
  capabilityId,
  actionId,
}) {
  const capabilityDefinition =
    getCapabilityDefinition(
      capabilityId,
    )

  if (!capabilityDefinition) {
    return null
  }

  const normalizedActionId =
    normalizeIdentifier(
      actionId,
    )

  return (
    capabilityDefinition[
      normalizedActionId
    ] ||
    null
  )
}


function createDeniedResult({
  capabilityId,
  actionId,
  reason,
}) {
  return {
    allowed:
      false,

    executable:
      false,

    approvalRequired:
      false,

    humanLoginRequired:
      false,

    permissionLevel:
      PERMISSION_LEVELS
        .BLOCKED,

    riskLevel:
      RISK_LEVELS.CRITICAL,

    reversible:
      false,

    capabilityId:
      normalizeIdentifier(
        capabilityId,
      ),

    actionId:
      normalizeIdentifier(
        actionId,
      ),

    reason,

    description:
      null,
  }
}


function evaluateCapabilityPermission({
  capabilityId,
  actionId,
  approved = false,
  humanLoginCompleted = false,
}) {
  const normalizedCapabilityId =
    normalizeIdentifier(
      capabilityId,
    )

  const normalizedActionId =
    normalizeIdentifier(
      actionId,
    )

  if (!normalizedCapabilityId) {
    return createDeniedResult({
      capabilityId,
      actionId,
      reason:
        "Capability ID puuttuu.",
    })
  }

  if (!normalizedActionId) {
    return createDeniedResult({
      capabilityId,
      actionId,
      reason:
        "Action ID puuttuu.",
    })
  }

  const capabilityDefinition =
    getCapabilityDefinition(
      normalizedCapabilityId,
    )

  if (!capabilityDefinition) {
    return createDeniedResult({
      capabilityId:
        normalizedCapabilityId,

      actionId:
        normalizedActionId,

      reason:
        "Kyvykkyyttä ei ole rekisteröity.",
    })
  }

  const actionDefinition =
    getActionDefinition({
      capabilityId:
        normalizedCapabilityId,

      actionId:
        normalizedActionId,
    })

  if (!actionDefinition) {
    return createDeniedResult({
      capabilityId:
        normalizedCapabilityId,

      actionId:
        normalizedActionId,

      reason:
        "Toimintoa ei ole rekisteröity tälle kyvykkyydelle.",
    })
  }

  const permissionLevel =
    actionDefinition
      .permissionLevel

  const approvalRequired =
    permissionLevel ===
    PERMISSION_LEVELS
      .APPROVAL_REQUIRED

  const humanLoginRequired =
    permissionLevel ===
    PERMISSION_LEVELS
      .HUMAN_LOGIN_REQUIRED

  const blocked =
    permissionLevel ===
    PERMISSION_LEVELS
      .BLOCKED

  const executable =
    !blocked &&
    (
      permissionLevel ===
        PERMISSION_LEVELS
          .AUTONOMOUS ||
      (
        approvalRequired &&
        approved
      ) ||
      (
        humanLoginRequired &&
        humanLoginCompleted
      )
    )

  let reason =
    "Toiminto voidaan suorittaa itsenäisesti."

  if (blocked) {
    reason =
      "Toiminto on estetty."
  } else if (
    approvalRequired &&
    !approved
  ) {
    reason =
      "Toiminto odottaa käyttäjän hyväksyntää."
  } else if (
    humanLoginRequired &&
    !humanLoginCompleted
  ) {
    reason =
      "Toiminto odottaa käyttäjän suorittamaa kirjautumista."
  } else if (
    approvalRequired &&
    approved
  ) {
    reason =
      "Käyttäjä on hyväksynyt toiminnon."
  } else if (
    humanLoginRequired &&
    humanLoginCompleted
  ) {
    reason =
      "Käyttäjän kirjautuminen on vahvistettu."
  }

  return {
    allowed:
      !blocked,

    executable,

    approvalRequired,

    humanLoginRequired,

    permissionLevel,

    riskLevel:
      actionDefinition
        .riskLevel,

    reversible:
      actionDefinition
        .reversible,

    capabilityId:
      normalizedCapabilityId,

    actionId:
      normalizedActionId,

    reason,

    description:
      actionDefinition
        .description,
  }
}


function listCapabilityPermissions(
  capabilityId,
) {
  const normalizedCapabilityId =
    normalizeIdentifier(
      capabilityId,
    )

  const capabilityDefinition =
    getCapabilityDefinition(
      normalizedCapabilityId,
    )

  if (!capabilityDefinition) {
    return []
  }

  return Object.entries(
    capabilityDefinition,
  ).map(
    ([
      actionId,
      definition,
    ]) => {
      return {
        capabilityId:
          normalizedCapabilityId,

        actionId,

        ...definition,
      }
    },
  )
}


function getPermissionLayerSummary() {
  const capabilityIds =
    Object.keys(
      permissionRegistry,
    )

  const actionCount =
    capabilityIds.reduce(
      (
        total,
        capabilityId,
      ) => {
        return (
          total +
          Object.keys(
            permissionRegistry[
              capabilityId
            ],
          ).length
        )
      },
      0,
    )

  return {
    name:
      "Capability Permission Layer",

    version:
      PERMISSION_LAYER_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    capabilityCount:
      capabilityIds.length,

    actionCount,

    capabilityIds,
  }
}


export {
  CAPABILITY_IDS,
  PERMISSION_LAYER_VERSION,
  PERMISSION_LEVELS,
  RISK_LEVELS,
  evaluateCapabilityPermission,
  getPermissionLayerSummary,
  listCapabilityPermissions,
}
