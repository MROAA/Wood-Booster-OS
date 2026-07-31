function AgentsPanel(){

const agents = [
"Product Agent",
"Workshop Agent",
"Pricing Agent",
"Marketing Agent",
"CRM Agent"
]


return (

<div className="
bg-neutral-900
border
border-neutral-800
rounded-2xl
p-6
">


<h2 className="
text-xl
font-bold
mb-5
">

🤖 Agents

</h2>


<div className="space-y-3">


{
agents.map(agent=>(

<div
key={agent}
className="
bg-neutral-800
rounded-xl
px-4
py-3
flex
justify-between
"
>

<span>
{agent}
</span>


<span className="
text-green-400
text-sm
">

ACTIVE

</span>


</div>

))
}


</div>


</div>

)

}


export default AgentsPanel
