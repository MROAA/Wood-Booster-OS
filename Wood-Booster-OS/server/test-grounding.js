import {
  validateGrounding
} from "./services/aiGroundingValidator.js"



const result =

validateGrounding({

answer:

`
Wood-Boosterin filosofia perustuu
aitouteen, laatuun ja rohkeuteen.

Wood-Booster on innovatiivinen yritys.
`,

knowledge:[

{

content:

`
Wood-Booster perustuu ajatukseen:
Me jatkamme puun tarinaa.

Tärkeät arvot ovat aitous,
laatu ja puun tarina.
`

}

]


})


console.log(result)