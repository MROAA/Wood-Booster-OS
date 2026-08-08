import {
  useEffect,
  useState,
} from "react"

import {
  apiGet,
  apiPut,
  apiUpload,
  apiDelete,
} from "../api/client"

import {
  getTheme,
  setTheme as persistTheme,
} from "../services/theme"

import CollapsibleSection from "../components/ui/CollapsibleSection"



const FILE_URL =
  "http://localhost:3001/uploads"



const emptyForm = {

  companyName: "",
  streetAddress: "",
  postalCode: "",
  city: "",
  businessId: "",
  phone: "",
  email: "",
  website: "",
  iban: "",

  vatPercent: "25.5",
  defaultPaymentTerms: "14 pv netto",
  defaultValidDays: "14",
  quoteNumberPrefix: "WB-Q",

  invoiceNumberPrefix: "WB-L",
  defaultInvoiceDueDays: "14",

}



function Settings() {


  const [
    settings,
    setSettings,
  ] = useState(null)


  const [
    form,
    setForm,
  ] = useState(emptyForm)


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    saving,
    setSaving,
  ] = useState(false)


  const [
    saved,
    setSaved,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState("")


  const [
    logoUploading,
    setLogoUploading,
  ] = useState(false)


  const [
    theme,
    setThemeState,
  ] = useState(
    getTheme()
  )




  useEffect(() => {

    let cancelled = false


    apiGet("/business-settings")
      .then(data => {

        if(cancelled) {

          return

        }


        setSettings(data)

      })
      .catch(loadError => {

        if(cancelled) {

          return

        }


        setError(
          loadError.message ||
          "Asetusten lataaminen epäonnistui."
        )

      })
      .finally(() => {

        if(!cancelled) {

          setLoading(false)

        }

      })


    return () => {

      cancelled = true

    }

  }, [])




  useEffect(() => {

    if(!settings) {

      return

    }


    setForm({

      companyName:
        settings.companyName || "",

      streetAddress:
        settings.streetAddress || "",

      postalCode:
        settings.postalCode || "",

      city:
        settings.city || "",

      businessId:
        settings.businessId || "",

      phone:
        settings.phone || "",

      email:
        settings.email || "",

      website:
        settings.website || "",

      iban:
        settings.iban || "",

      vatPercent:
        String(
          settings.vatPercent ?? "25.5"
        ),

      defaultPaymentTerms:
        settings.defaultPaymentTerms ||
        "14 pv netto",

      defaultValidDays:
        String(
          settings.defaultValidDays ?? "14"
        ),

      quoteNumberPrefix:
        settings.quoteNumberPrefix ||
        "WB-Q",

      invoiceNumberPrefix:
        settings.invoiceNumberPrefix ||
        "WB-L",

      defaultInvoiceDueDays:
        String(
          settings.defaultInvoiceDueDays ?? "14"
        ),

    })


    setSaved(false)

  }, [settings])




  function handleChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target


    setForm(
      current => ({

        ...current,

        [name]:
          value,

      })
    )


    setSaved(false)

  }




  async function handleSubmit(
    event
  ) {

    event.preventDefault()


    try {

      setSaving(true)

      setError("")


      const updated =
        await apiPut(
          "/business-settings",
          {

            companyName:
              form.companyName,

            streetAddress:
              form.streetAddress,

            postalCode:
              form.postalCode,

            city:
              form.city,

            businessId:
              form.businessId,

            phone:
              form.phone,

            email:
              form.email,

            website:
              form.website,

            iban:
              form.iban,

            vatPercent:
              Number(form.vatPercent),

            defaultPaymentTerms:
              form.defaultPaymentTerms,

            defaultValidDays:
              Number(form.defaultValidDays),

            quoteNumberPrefix:
              form.quoteNumberPrefix,

            invoiceNumberPrefix:
              form.invoiceNumberPrefix,

            defaultInvoiceDueDays:
              Number(form.defaultInvoiceDueDays),

          }
        )


      setSettings(updated)

      setSaved(true)

    } catch(saveError) {

      setError(
        saveError.message ||
        "Asetusten tallentaminen epäonnistui."
      )

    } finally {

      setSaving(false)

    }

  }




  async function handleLogoUpload(
    event
  ) {

    const file =
      event.target.files?.[0]


    if(!file) {

      return

    }


    try {

      setLogoUploading(true)

      setError("")


      const formData =
        new FormData()

      formData.append(
        "file",
        file
      )


      const updated =
        await apiUpload(
          "/business-settings/logo",
          formData
        )


      setSettings(updated)

    } catch(uploadError) {

      setError(
        uploadError.message ||
        "Logon lataaminen epäonnistui."
      )

    } finally {

      setLogoUploading(false)

      event.target.value = ""

    }

  }




  async function handleLogoDelete() {

    const shouldDelete =
      window.confirm(
        "Poistetaanko logo?"
      )


    if(!shouldDelete) {

      return

    }


    try {

      const updated =
        await apiDelete(
          "/business-settings/logo"
        )


      setSettings(updated)

    } catch(deleteError) {

      setError(
        deleteError.message ||
        "Logon poistaminen epäonnistui."
      )

    }

  }




  function handleThemeToggle() {

    const nextTheme =
      theme === "dark"
        ?
        "light"
        :
        "dark"


    persistTheme(nextTheme)

    setThemeState(nextTheme)

  }




  return (

    <div
      className="
        space-y-8
      "
    >



      <section>

        <h1
          className="
            page-title
          "
        >

          Settings

        </h1>


        <p
          className="
            page-description
          "
        >

          Wood-Booster OS:n järjestelmäasetukset ja ympäristö.

        </p>


      </section>




      {
        error && (

          <div className="panel text-red-400">
            {error}
          </div>

        )
      }




      {
        loading

        ?

        (

          <div className="panel p-6">
            Ladataan asetuksia...
          </div>

        )

        :

        (

          <form onSubmit={handleSubmit} className="space-y-8">


            <section className="panel space-y-5">

              <div>

                <h2 className="text-lg font-semibold">
                  Yrityksen tiedot
                </h2>


                <p className="mt-1 text-sm text-[var(--wood-muted)]">
                  Näkyvät automaattisesti tulostettavissa tarjouksissa.
                </p>

              </div>



              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                {
                  settings?.logoStoredName && (

                    <img

                      src={
                        `${FILE_URL}/business/${settings.logoStoredName}`
                      }

                      alt="Yrityksen logo"

                      className="h-16 w-16 rounded-lg border border-[var(--wood-border)] object-contain bg-white p-1"

                    />

                  )
                }


                <div className="flex items-center gap-4">

                  <label className="wb-button cursor-pointer">

                    {
                      logoUploading
                      ?
                      "Ladataan..."
                      :
                      settings?.logoStoredName
                      ?
                      "Vaihda logo"
                      :
                      "Lataa logo"
                    }


                    <input

                      type="file"

                      accept="image/*"

                      onChange={handleLogoUpload}

                      disabled={logoUploading}

                      className="hidden"

                    />

                  </label>



                  {
                    settings?.logoStoredName && (

                      <button

                        type="button"

                        onClick={handleLogoDelete}

                        className="text-sm text-red-400 hover:text-red-300"

                      >
                        Poista logo
                      </button>

                    )
                  }

                </div>

              </div>



              <div className="grid gap-4 md:grid-cols-2">

                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Yrityksen nimi
                  </span>


                  <input

                    type="text"

                    name="companyName"

                    value={form.companyName}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Y-tunnus
                  </span>


                  <input

                    type="text"

                    name="businessId"

                    value={form.businessId}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Katuosoite
                  </span>


                  <input

                    type="text"

                    name="streetAddress"

                    value={form.streetAddress}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <div className="grid grid-cols-2 gap-4">

                  <label>

                    <span className="text-sm text-[var(--wood-muted)]">
                      Postinumero
                    </span>


                    <input

                      type="text"

                      name="postalCode"

                      value={form.postalCode}

                      onChange={handleChange}

                      className="mt-2 wb-input"

                    />

                  </label>



                  <label>

                    <span className="text-sm text-[var(--wood-muted)]">
                      Kaupunki
                    </span>


                    <input

                      type="text"

                      name="city"

                      value={form.city}

                      onChange={handleChange}

                      className="mt-2 wb-input"

                    />

                  </label>

                </div>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Puhelin
                  </span>


                  <input

                    type="text"

                    name="phone"

                    value={form.phone}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Sähköposti
                  </span>


                  <input

                    type="email"

                    name="email"

                    value={form.email}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Verkkosivu
                  </span>


                  <input

                    type="text"

                    name="website"

                    value={form.website}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Tilinumero (IBAN)
                  </span>


                  <input

                    type="text"

                    name="iban"

                    value={form.iban}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>

              </div>


            </section>




            <CollapsibleSection

              title="Laskutus- ja tarjousasetukset"

              summary={
                `ALV ${form.vatPercent}% · Tarjous voimassa ${form.defaultValidDays} pv · Laskun eräpäivä ${form.defaultInvoiceDueDays} pv`
              }

            >

              <h3 className="text-sm font-semibold text-[var(--wood-muted)]">
                Tarjousten oletusarvot
              </h3>


              <div className="mt-3 grid gap-4 md:grid-cols-2">

                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    ALV %
                  </span>


                  <input

                    type="number"

                    step="0.1"

                    min="0"

                    max="100"

                    name="vatPercent"

                    value={form.vatPercent}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Voimassaoloaika (päivää)
                  </span>


                  <input

                    type="number"

                    min="1"

                    name="defaultValidDays"

                    value={form.defaultValidDays}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Oletusmaksuehdot
                  </span>


                  <input

                    type="text"

                    name="defaultPaymentTerms"

                    value={form.defaultPaymentTerms}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Tarjousnumeroinnin etuliite
                  </span>


                  <input

                    type="text"

                    name="quoteNumberPrefix"

                    value={form.quoteNumberPrefix}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>

              </div>


              <h3 className="mt-6 text-sm font-semibold text-[var(--wood-muted)]">
                Laskutuksen oletusarvot
              </h3>


              <div className="mt-3 grid gap-4 md:grid-cols-2">

                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Eräpäivä (päivää)
                  </span>


                  <input

                    type="number"

                    min="1"

                    name="defaultInvoiceDueDays"

                    value={form.defaultInvoiceDueDays}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>



                <label>

                  <span className="text-sm text-[var(--wood-muted)]">
                    Laskunumeroinnin etuliite
                  </span>


                  <input

                    type="text"

                    name="invoiceNumberPrefix"

                    value={form.invoiceNumberPrefix}

                    onChange={handleChange}

                    className="mt-2 wb-input"

                  />

                </label>

              </div>


            </CollapsibleSection>




            <div className="flex flex-wrap items-center gap-4">

              <button

                type="submit"

                disabled={saving}

                className="wb-button disabled:cursor-not-allowed disabled:opacity-50"

              >

                {
                  saving
                  ?
                  "Tallennetaan..."
                  :
                  "Tallenna asetukset"
                }

              </button>



              {
                saved && (

                  <span className="text-sm font-medium text-green-400">
                    ✓ Asetukset tallennettu
                  </span>

                )
              }

            </div>


          </form>

        )

      }




      <section className="panel space-y-4">

        <h2 className="text-lg font-semibold">
          Ulkoasu
        </h2>


        <div className="flex items-center gap-4">

          <button

            type="button"

            onClick={handleThemeToggle}

            className="wb-button"

          >

            {
              theme === "dark"
              ?
              "Vaihda vaaleaan teemaan"
              :
              "Vaihda tummaan teemaan"
            }

          </button>


          <span className="text-sm text-[var(--wood-muted)]">

            Nykyinen teema:
            {" "}
            {
              theme === "dark"
              ?
              "Tumma"
              :
              "Vaalea"
            }

          </span>

        </div>


      </section>




      <CollapsibleSection

        title="Tietoa järjestelmästä"

        summary="Tekninen yleiskatsaus ja tulevat ominaisuudet"

      >

        <div
          className="
            grid
            grid-cols-1
            gap-8
            lg:grid-cols-2
          "
        >


          <div
            className="
              space-y-4
            "
          >


            <h3
              className="
                text-sm
                font-semibold
                text-[var(--wood-muted)]
              "
            >

              Workspace

            </h3>



            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                Järjestelmä

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                Wood-Booster OS

              </p>


            </div>


            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                Käyttötila

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                Local Workspace

              </p>


            </div>


            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                Interface

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                Minimal Natural Theme

              </p>


            </div>


          </div>




          <div
            className="
              space-y-4
            "
          >


            <h3
              className="
                text-sm
                font-semibold
                text-[var(--wood-muted)]
              "
            >

              System

            </h3>



            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                Frontend

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                React Workspace

              </p>


            </div>


            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                AI Layer

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                Spacemonkey

              </p>


            </div>


            <div>

              <p
                className="
                  text-sm
                  text-[var(--wood-muted)]
                "
              >

                Storage

              </p>


              <p
                className="
                  mt-1
                  text-[var(--wood-text)]
                "
              >

                Local Data

              </p>


            </div>


          </div>


        </div>




        <h3
          className="
            mt-8
            text-sm
            font-semibold
            text-[var(--wood-muted)]
          "
        >

          Wood-Booster Identity

        </h3>


        <p
          className="
            mt-3
            text-sm
            leading-6
            text-[var(--wood-muted)]
          "
        >

          Wood-Booster OS rakentuu rauhallisen työympäristön,
          kestävän kehityksen ja ihmislähtöisen teknologian
          ympärille. Järjestelmä toimii käyttäjän työkaluna,
          ei käyttäjän korvaajana.

        </p>




        <h3
          className="
            mt-8
            text-sm
            font-semibold
            text-[var(--wood-muted)]
          "
        >

          Future Modules

        </h3>


        <div
          className="
            mt-4
            space-y-3
          "
        >


          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-card)]
              p-4
            "
          >

            <p
              className="
                text-sm
                text-[var(--wood-text)]
              "
            >

              Spacemonkey Profile

            </p>

            <p
              className="
                mt-1
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Persoonallisuus- ja toimintamoduuli.

            </p>


          </div>


          <div
            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-card)]
              p-4
            "
          >

            <p
              className="
                text-sm
                text-[var(--wood-text)]
              "
            >

              Advanced System Controls

            </p>

            <p
              className="
                mt-1
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Tulevat järjestelmänhallinnan työkalut.

            </p>


          </div>


        </div>


      </CollapsibleSection>




    </div>

  )

}


export default Settings
