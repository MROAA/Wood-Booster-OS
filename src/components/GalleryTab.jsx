import {
  useEffect,
  useRef,
  useState,
} from "react"



const API_URL =
  "http://localhost:3001/api"



const FILE_URL =
  "http://localhost:3001/uploads"



const GALLERY_CATEGORY =
  "Kuvat"



function GalleryTab({
  projectId,
}) {


  const fileInputRef =
    useRef(null)



  const [
    images,
    setImages,
  ] = useState([])



  const [
    selectedImage,
    setSelectedImage,
  ] = useState(null)



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    uploading,
    setUploading,
  ] = useState(false)



  const [
    errorMessage,
    setErrorMessage,
  ] = useState("")





  useEffect(() => {

    if(!projectId) {

      return

    }


    let cancelled = false


    async function loadImages() {

      try {

        setLoading(true)

        setErrorMessage("")


        const response =
          await fetch(
            `${API_URL}/projects/${projectId}/files`,
          )


        const data =
          await response.json()


        if(!response.ok) {

          throw new Error(
            data.error ||
            "Kuvien hakeminen epäonnistui"
          )

        }


        if(cancelled) {

          return

        }


        const files =
          Array.isArray(data)
          ?
          data
          :
          []


        setImages(
          files.filter(
            file =>
              file.category === GALLERY_CATEGORY
          )
        )

      }

      catch(loadError) {

        if(cancelled) {

          return

        }


        console.error(
          loadError
        )


        setErrorMessage(
          loadError.message
        )

      }

      finally {

        if(!cancelled) {

          setLoading(false)

        }

      }

    }


    loadImages()


    setSelectedImage(null)


    return () => {

      cancelled = true

    }

  },[
    projectId,
  ])




  function openFilePicker() {

    fileInputRef.current?.click()

  }




  async function handleFilesSelected(
    event
  ) {


    const files =
      Array.from(
        event.target.files || []
      ).filter(
        file =>
          file.type.startsWith("image/")
      )


    if(
      files.length === 0
    ) {

      event.target.value =
        ""


      return

    }


    setErrorMessage("")


    try {

      setUploading(true)


      for(
        const file of files
      ) {


        const formData =
          new FormData()


        formData.append(
          "file",
          file
        )


        formData.append(
          "category",
          GALLERY_CATEGORY
        )


        const response =
          await fetch(
            `${API_URL}/projects/${projectId}/files`,
            {

              method:
                "POST",

              body:
                formData,

            }
          )


        const data =
          await response.json()


        if(!response.ok) {

          throw new Error(
            data.error ||
            `Kuvan ${file.name} lataaminen epäonnistui`
          )

        }


        setImages(
          current => [
            data,
            ...current,
          ]
        )

      }

    }

    catch(uploadError) {

      console.error(
        uploadError
      )


      setErrorMessage(
        uploadError.message
      )

    }

    finally {

      setUploading(false)


      event.target.value =
        ""

    }


  }




  async function deleteImage(
    image
  ) {


    const shouldDelete =
      window.confirm(
        "Poistetaanko tämä kuva projektista?"
      )


    if(
      !shouldDelete
    ) {

      return

    }


    try {

      const response =
        await fetch(
          `${API_URL}/files/${image.id}`,
          {

            method:
              "DELETE",

          }
        )


      const data =
        await response.json()


      if(!response.ok) {

        throw new Error(
          data.error ||
          "Kuvan poistaminen epäonnistui"
        )

      }


      setImages(
        current =>
          current.filter(
            item =>
              item.id !== image.id
          )
      )


      if(
        selectedImage?.id === image.id
      ) {

        setSelectedImage(null)

      }

    }

    catch(deleteError) {

      console.error(
        deleteError
      )


      setErrorMessage(
        deleteError.message
      )

    }


  }




  function imageUrl(
    image
  ) {

    return `${FILE_URL}/projects/${projectId}/${image.storedName}`

  }




  return (

    <>

      <section
        className="
          panel
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          <div>

            <p
              className="
                text-xs
                uppercase
                tracking-wider
                text-[var(--wood-muted)]
              "
            >
              Media
            </p>


            <h2
              className="
                mt-2
                text-2xl
                font-semibold
              "
            >
              Projektin kuvat
            </h2>


            <p
              className="
                mt-2
                text-[var(--wood-muted)]
              "
            >
              Tallenna työvaiheet,
              luonnokset ja valmiit kuvat.
            </p>


          </div>




          <button

            type="button"

            onClick={
              openFilePicker
            }

            disabled={
              uploading
            }

            className="
              wb-button
              disabled:cursor-not-allowed
              disabled:opacity-50
            "

          >

            {
              uploading
              ?
              "Ladataan..."
              :
              "+ Lisää kuvia"
            }

          </button>



          <input

            ref={
              fileInputRef
            }

            type="file"

            accept="image/*"

            multiple

            onChange={
              handleFilesSelected
            }

            className="
              hidden
            "

          />


        </div>
        {
          errorMessage && (

            <div
              className="
                mt-5
                card
                border-red-900/60
                bg-red-950/30
                p-3
                text-sm
                text-red-300
              "
            >

              {errorMessage}

            </div>

          )
        }





        {
          loading

          ?

          (

            <div
              className="
                mt-6
                text-sm
                text-[var(--wood-muted)]
              "
            >

              Ladataan kuvia...

            </div>

          )

          :

          images.length === 0

          ?

          (

            <button

              type="button"

              onClick={
                openFilePicker
              }

              className="
                mt-6
                w-full
                rounded-2xl
                border
                border-dashed
                border-[var(--wood-border)]
                p-12
                text-center
              "

            >

              <span
                className="
                  text-5xl
                "
              >
                📷
              </span>


              <span
                className="
                  mt-5
                  block
                  text-xl
                  font-semibold
                "
              >
                Ei kuvia vielä
              </span>


              <span
                className="
                  mx-auto
                  mt-2
                  block
                  max-w-lg
                  text-[var(--wood-muted)]
                "
              >
                Lisää ensimmäinen kuva projektiin.
              </span>


            </button>

          )


          :


          (

            <div
              className="
                mt-6
                grid
                gap-5
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >

              {
                images.map(
                  image => (

                    <article

                      key={
                        image.id
                      }

                      className="
                        card
                        overflow-hidden
                      "

                    >

                      <button

                        type="button"

                        onClick={() =>
                          setSelectedImage(
                            image
                          )
                        }

                        className="
                          block
                          w-full
                        "

                      >

                        <img

                          src={
                            imageUrl(image)
                          }

                          alt={
                            image.originalName ||
                            "Projektin kuva"
                          }

                          className="
                            aspect-square
                            w-full
                            object-cover
                          "

                        />

                      </button>





                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                          p-4
                        "
                      >

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              truncate
                              font-medium
                            "
                          >

                            {
                              image.originalName ||
                              "Nimetön kuva"
                            }

                          </p>


                          <p
                            className="
                              mt-1
                              text-xs
                              text-[var(--wood-muted)]
                            "
                          >

                            {
                              formatDate(
                                image.createdAt
                              )
                            }

                          </p>


                        </div>





                        <button

                          type="button"

                          onClick={() =>
                            deleteImage(
                              image
                            )
                          }

                          className="
                            rounded-lg
                            px-3
                            py-2
                            text-sm
                            text-red-400
                          "

                        >

                          Poista

                        </button>


                      </div>


                    </article>

                  )

                )

              }


            </div>

          )

        }


      </section>






      {
        selectedImage && (

          <div

            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/85
              p-4
            "

            onClick={() =>
              setSelectedImage(null)
            }

          >

            <div

              className="
                max-h-[92vh]
                w-full
                max-w-5xl
                overflow-hidden
                rounded-2xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-panel)]
              "

              onClick={
                event =>
                  event.stopPropagation()
              }

            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-b
                  border-[var(--wood-border)]
                  p-4
                "
              >

                <div>

                  <p
                    className="
                      font-semibold
                    "
                  >

                    {
                      selectedImage.originalName
                    }

                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--wood-muted)]
                    "
                  >

                    {
                      formatDate(
                        selectedImage.createdAt
                      )
                    }

                  </p>


                </div>




                <button

                  type="button"

                  onClick={() =>
                    setSelectedImage(null)
                  }

                  className="
                    rounded-lg
                    border
                    border-[var(--wood-border)]
                    px-4
                    py-2
                  "

                >

                  Sulje

                </button>


              </div>





              <div
                className="
                  flex
                  max-h-[78vh]
                  items-center
                  justify-center
                  overflow-auto
                  bg-black
                  p-4
                "
              >

                <img

                  src={
                    imageUrl(selectedImage)
                  }

                  alt={
                    selectedImage.originalName
                  }

                  className="
                    max-h-[72vh]
                    max-w-full
                    object-contain
                  "

                />

              </div>


            </div>


          </div>

        )

      }

    </>

  )

}







function formatDate(
  dateValue
) {

  if(!dateValue) {

    return ""

  }



  return new Intl.DateTimeFormat(
    "fi-FI",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  )
  .format(
    new Date(dateValue)
  )

}



export default GalleryTab
