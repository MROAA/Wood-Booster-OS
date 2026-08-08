function PythonSpacemonkeyCard({
  python,
}){


return (

<div
className="
p-6
rounded-xl
border
border-[var(--wood-border)]
bg-[var(--wood-panel)]
space-y-4
"
>


<h2
className="
text-lg
font-semibold
text-[var(--wood-text)]
"
>
Python Spacemonkey
</h2>



<div>

<p
className="
text-sm
text-gray-400
"
>
Status
</p>

<p
className="
text-xl
"
>
{
python?.available
?
"🟢 Online"
:
"⚪ Offline"
}
</p>

</div>



{
python?.available &&
python?.system
?

<>

<div>

<p
className="
text-sm
text-gray-400
"
>
Mode
</p>

<p>
{
python.system.personality_profile?.primary_mode
||
"-"
}
</p>

</div>



<div>

<p
className="
text-sm
text-gray-400
"
>
Security
</p>

<p>
{
python.system.security_status?.status
||
"-"
}
{
" "
}
(Estetty: {
python.system.security_status?.violations_blocked ?? 0
})
</p>

</div>



<div>

<p
className="
text-sm
text-gray-400
"
>
Tunnetila
</p>

<p
className="
text-sm
"
>
Stressi: {
python.system.limbic_state?.stress?.toFixed(2) ?? "-"
}
{" · "}
Uteliaisuus: {
python.system.limbic_state?.curiosity?.toFixed(2) ?? "-"
}
</p>

</div>

</>

:

<p
className="
text-sm
text-gray-400
"
>
{
python?.error
||
"Python-Spacemonkey ei ole tavoitettavissa."
}
</p>

}



</div>

)

}


export default PythonSpacemonkeyCard
