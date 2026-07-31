function Section({

title,

description,

children,

}){


return (

<section

className="
space-y-3
"

>


<header>


<h2

className="
text-lg
font-semibold
"

>

{title}

</h2>



{

description &&

<p

className="
text-sm
"

style={{

color:
"var(--wood-muted)"

}}

>

{description}

</p>

}


</header>





<div>

{children}

</div>



</section>

)

}


export default Section
