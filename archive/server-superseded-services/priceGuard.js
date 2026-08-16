export function validatePriceClaims({

  answer,

  knowledge = []

}) {


const warnings = []


const text =

answer.toLowerCase()



const pricePattern =

/(\d[\d\s]*)\s?(€|euro|eur)/gi



const prices =

text.match(pricePattern)



if(!prices){


return {

valid:true,

warnings:[],

score:100

}


}





const knowledgeText =

knowledge

.map(

item =>

item.content || ""

)

.join(" ")

.toLowerCase()





for(

const price of prices

){


if(

!knowledgeText.includes(

price.toLowerCase()

)

){


warnings.push({

type:

"unsupported_price",


message:

`Tarkkaa hintaa ei löytynyt tietolähteistä: ${price}`


})


}


}





return {


valid:

warnings.length === 0,


warnings,


score:

Math.max(

0,

100 -

warnings.length * 30

)


}


}
