import {useEffect,useState} from "react"
import axios from "axios"
import EditMember from "./EditMember"

function Members(){

const [members,setMembers]=useState([])
const [search,setSearch]=useState("")

const [name,setName]=useState("")
const [months,setMonths]=useState("")
const [price,setPrice]=useState("")
const [discount,setDiscount]=useState("")

useEffect(()=>{
fetchMembers()
},[])

const fetchMembers = async()=>{
const res = await axios.get("http://localhost:5000/members")
setMembers(res.data)
}

const addMember = async()=>{

await axios.post("http://localhost:5000/add_member",{
name,
months,
price,
discount
})

fetchMembers()

}

const deleteMember = async(id)=>{
await axios.delete(`http://localhost:5000/delete_member/${id}`)
fetchMembers()
}

const filtered = members.filter(m =>
m.name.toLowerCase().includes(search.toLowerCase())
)

return(

<div className="container">

<h2>Members</h2>

<input
placeholder="Search member"
onChange={(e)=>setSearch(e.target.value)}
/>

<div className="card">

<h3>Add Member</h3>

<input placeholder="Name" onChange={e=>setName(e.target.value)} />
<input placeholder="Months" onChange={e=>setMonths(e.target.value)} />
<input placeholder="Price" onChange={e=>setPrice(e.target.value)} />
<input placeholder="Discount %" onChange={e=>setDiscount(e.target.value)} />

<button onClick={addMember}>Add Member</button>

</div>

<table>

<thead>
<tr>
<th>Name</th>
<th>Months</th>
<th>Expiration</th>
<th>Action</th>
</tr>
</thead>

<tbody>

{filtered.map(m=>(
<tr key={m.id}>

<td>{m.name}</td>
<td>{m.months}</td>
<td>{m.expiration_date}</td>

<td>

<button onClick={()=>deleteMember(m.id)}>Delete</button>

<EditMember member={m} refresh={fetchMembers}/>

</td>

</tr>
))}

</tbody>

</table>

</div>

)

}

export default Members