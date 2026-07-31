function BrandCard({
  children,
  className = "",
}){


  return (

    <div

      className={`
        rounded-2xl
        p-5
        ${className}
      `}

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)",


        boxShadow:
          "0 10px 30px rgba(0,0,0,0.25)"

      }}

    >

      {children}

    </div>

  )

}


export default BrandCard
