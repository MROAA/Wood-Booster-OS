const customers = [
  {
    name: "Matti Meikäläinen",
    company: "Design Home Oy",
    status: "ACTIVE",
    projects: 2,
    value: "12 500 €",
    ai:
      "CRM Agent voi auttaa asiakasviestinnässä.",
  },

  {
    name: "Anna Virtanen",
    company: "Private Client",
    status: "LEAD",
    projects: 1,
    value: "5 800 €",
    ai:
      "Marketing Agent voi ehdottaa yhteydenottoa.",
  },

  {
    name: "Portfolio Customer",
    company: "Showcase",
    status: "COMPLETED",
    projects: 3,
    value: "25 000 €",
    ai:
      "Project history available.",
  },
]


function Customers(){

return (

<div className="space-y-8">


<header>

<p className="
text-sm
font-semibold
uppercase
tracking-[0.25em]
text-amber-500
">

Business OS

</p>


<h1 className="
mt-2
text-4xl
font-bold
">

👥 CRM OS

</h1>


<p className="
mt-3
max-w-3xl
text-neutral-400
">

Asiakashallinta yhdistettynä AI Brainiin.
CRM Agent auttaa viestinnässä,
tarjouksissa ja asiakasprosessissa.

</p>


</header>




<section className="
grid
grid-cols-1
md:grid-cols-4
gap-4
">


<Stat
title="Customers"
value="3"
/>


<Stat
title="Active Projects"
value="6"
/>


<Stat
title="Pipeline"
value="18 300 €"
/>


<Stat
title="CRM Agent"
value="READY"
/>


</section>




<section className="
grid
grid-cols-1
xl:grid-cols-2
gap-6
">


{
customers.map(customer=>(

<CustomerCard
key={customer.name}
customer={customer}
/>

))

}


</section>



</div>

)

}




function Stat({
title,
value
}){

return (

<div className="
bg-neutral-900
border
border-neutral-800
rounded-2xl
p-5
">


<p className="
text-neutral-500
text-sm
">

{title}

</p>


<p className="
mt-2
text-3xl
font-bold
">

{value}

</p>


</div>

)

}





function CustomerCard({
customer
}){

return (

<article className="
bg-neutral-900
border
border-neutral-800
rounded-2xl
p-6
">


<div className="
flex
justify-between
items-start
">


<div>

<h2 className="
text-xl
font-bold
">

{customer.name}

</h2>


<p className="
text-neutral-400
mt-1
">

{customer.company}

</p>

</div>



<span className="
text-green-400
text-sm
">

{customer.status}

</span>


</div>




<div className="
mt-6
grid
grid-cols-2
gap-4
">


<div className="
bg-neutral-800
rounded-xl
p-4
">

<p className="text-neutral-500 text-sm">
Projects
</p>

<p className="text-xl font-bold">
{customer.projects}
</p>

</div>



<div className="
bg-neutral-800
rounded-xl
p-4
">

<p className="text-neutral-500 text-sm">
Value
</p>

<p className="text-xl font-bold">
{customer.value}
</p>

</div>


</div>




<div className="
mt-6
rounded-xl
bg-neutral-800
p-4
text-sm
text-neutral-300
">

🤖 {customer.ai}

</div>



<div className="
mt-5
flex
gap-3
">


<button
className="
rounded-xl
bg-neutral-800
px-4
py-2
hover:bg-neutral-700
"
>

Open

</button>


<button
className="
rounded-xl
bg-amber-500
px-4
py-2
text-black
font-bold
"
>

AI Assist

</button>


</div>


</article>

)

}


export default Customers
