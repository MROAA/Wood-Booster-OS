import {
  useEffect,
  useMemo,
  useState,
} from "react"



const VAT_PERCENT =
  25.5





function QuoteTab({

  project,

  materialTotal,

  laborTotal,

  otherCosts,

  productionCost,

  recommendedPrice,

}) {


  const storageKey =
    `woodBoosterQuote:${project.id}`



  const [
    quote,
    setQuote,
  ] = useState(
    () =>
      readQuote(storageKey)
  )





  useEffect(() => {

    setQuote(
      readQuote(storageKey)
    )

  },[
    storageKey,
  ])







  const netPrice =
    useMemo(() => {

      const customPrice =
        toNumber(
          quote.customPrice
        )


      return customPrice > 0

        ?

        customPrice

        :

        toNumber(
          recommendedPrice
        )

    },[
      quote.customPrice,
      recommendedPrice,
    ])







  const vatAmount =
    netPrice *
    (
      VAT_PERCENT /
      100
    )



  const totalWithVat =
    netPrice +
    vatAmount







  const quoteNumber =
    useMemo(
      () =>
        createQuoteNumber(
          project
        ),

      [
        project,
      ]
    )







  const quoteDate =
    useMemo(
      () =>
        new Date(),

      [
        project.id,
      ]
    )







  const validUntil =
    useMemo(() => {


      const date =
        new Date(
          quoteDate
        )


      date.setDate(

        date.getDate()
        +
        toNumber(
          quote.validDays
        )

      )


      return date


    },[
      quoteDate,
      quote.validDays,
    ])







  function handleChange(
    event
  ) {


    const {
      name,
      value,
    } =
      event.target



    setQuote(
      current => ({

        ...current,

        [name]:
          value,

      })
    )


  }







  function saveQuote() {


    const savedQuote = {

      ...quote,

      quoteNumber,

      updatedAt:
        new Date().toISOString(),

    }



    localStorage.setItem(

      storageKey,

      JSON.stringify(
        savedQuote
      )

    )



    setQuote(
      savedQuote
    )


    window.alert(
      "Tarjous tallennettu."
    )


  }







  function printQuote() {

    window.print()

  }
  return (

    <div
      className="
        space-y-6
      "
    >

      <section
        className="
          panel
          p-6
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-wider
            text-[var(--wood-muted)]
          "
        >
          Quote
        </p>


        <h2
          className="
            mt-2
            text-2xl
            font-semibold
          "
        >
          Tarjous
          {" "}
          {project.name}
        </h2>


        <p
          className="
            mt-2
            text-[var(--wood-muted)]
          "
        >
          Luo projektista tarjouslaskelma.
        </p>


      </section>






      <section
        className="
          panel
          p-6
        "
      >

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >

          <Field
            label="Tarjouksen voimassaolo (päivää)"
            name="validDays"
            value={quote.validDays}
            onChange={handleChange}
          />


          <Field
            label="Maksuehto"
            name="paymentTerms"
            value={quote.paymentTerms}
            onChange={handleChange}
          />


          <Field
            label="Toimitusaika"
            name="deliveryTime"
            value={quote.deliveryTime}
            onChange={handleChange}
          />


          <Field
            label="Mukautettu hinta"
            name="customPrice"
            value={quote.customPrice}
            onChange={handleChange}
          />

        </div>




        <div
          className="
            mt-6
            grid
            gap-4
            md:grid-cols-3
          "
        >

          <Summary
            label="Materiaalit"
            value={materialTotal}
          />


          <Summary
            label="Työ"
            value={laborTotal}
          />


          <Summary
            label="Muut kulut"
            value={otherCosts}
          />

        </div>






        <div
          className="
            mt-6
            rounded-2xl
            border
            border-[var(--wood-border)]
            p-5
          "
        >

          <p
            className="
              text-sm
              text-[var(--wood-muted)]
            "
          >
            Tarjoushinta
          </p>


          <p
            className="
              mt-2
              text-3xl
              font-bold
            "
          >
            {formatMoney(totalWithVat)}
          </p>


          <p
            className="
              mt-2
              text-sm
              text-[var(--wood-muted)]
            "
          >

            Alv {VAT_PERCENT} %
            {" "}
            {formatMoney(vatAmount)}

          </p>


        </div>






        <div
          className="
            mt-6
            flex
            flex-wrap
            gap-3
          "
        >

          <button

            className="
              wb-button
            "

            onClick={
              saveQuote
            }

          >
            Tallenna tarjous

          </button>




          <button

            className="
              rounded-xl
              border
              border-[var(--wood-border)]
              px-5
              py-3
            "

            onClick={
              printQuote
            }

          >

            Tulosta

          </button>


        </div>


      </section>





      <section
        className="
          panel
          p-6
        "
      >

        <h3
          className="
            text-xl
            font-semibold
          "
        >
          Tarjouksen tiedot
        </h3>


        <div
          className="
            mt-4
            space-y-2
            text-sm
          "
        >

          <p>
            Numero:
            {" "}
            {quoteNumber}
          </p>


          <p>
            Päivä:
            {" "}
            {formatDate(quoteDate)}
          </p>


          <p>
            Voimassa:
            {" "}
            {formatDate(validUntil)}
          </p>


        </div>


      </section>


    </div>

  )

}







function Field({
  label,
  name,
  value,
  onChange,
}) {

  return (

    <label>

      <span
        className="
          text-sm
          text-[var(--wood-muted)]
        "
      >

        {label}

      </span>


      <input

        className="
          wb-input
        "

        name={name}

        value={value || ""}

        onChange={onChange}

      />


    </label>

  )

}







function Summary({
  label,
  value,
}) {

  return (

    <div
      className="
        card
        p-4
      "
    >

      <p
        className="
          text-xs
          text-[var(--wood-muted)]
        "
      >

        {label}

      </p>


      <p
        className="
          mt-2
          text-xl
          font-semibold
        "
      >

        {formatMoney(value)}

      </p>


    </div>

  )

}







function readQuote(
  key
) {

  try {

    const saved =
      localStorage.getItem(
        key
      )


    return saved
      ?
      JSON.parse(saved)
      :
      {
        validDays: 14,
        paymentTerms: "14 pv netto",
        deliveryTime: "",
        customPrice: "",
      }


  }

  catch {

    return {
      validDays: 14,
      paymentTerms: "14 pv netto",
      deliveryTime: "",
      customPrice: "",
    }

  }

}







function toNumber(
  value
) {

  const number =
    Number(
      value
    )


  return Number.isFinite(number)
    ?
    number
    :
    0

}







function formatMoney(
  value
) {

  return new Intl.NumberFormat(
    "fi-FI",
    {
      style:
        "currency",

      currency:
        "EUR",
    }
  )
  .format(
    toNumber(value)
  )

}







function createQuoteNumber(
  project
) {

  return (
    "WB-"
    +
    String(project.id)
      .slice(-6)
      .toUpperCase()
  )

}







function formatDate(
  value
) {

  return new Intl.DateTimeFormat(
    "fi-FI"
  )
  .format(
    new Date(value)
  )

}







export default QuoteTab
