function Card({

  children,

  className="",

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
"1px solid var(--wood-border)"

}}

>

{children}

</div>

)

}


export default Card
