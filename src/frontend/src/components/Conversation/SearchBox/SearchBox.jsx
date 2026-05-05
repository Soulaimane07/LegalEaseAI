import React, { useState } from 'react'
import { IoIosSearch } from "react-icons/io";
import { auth } from "./firebase"; 

function SearchBox() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && query.trim() !== "") {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("Please sign in before starting a new consultation thread.");
          setLoading(false);
          return;
        }
        
        // Force-refresh token string to ensure validity
        const token = await currentUser.getIdToken(true);

        const payload = {
          title: query, 
        };
        console.log("YOUR AUTH TOKEN IS:", token);

        // TO THIS (Add the credentials parameter to the fetch block):
        const response = await fetch("https://silver-fiesta-p5x6gpxv5w9c7p9r-8000.app.github.dev/api/chat/new", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${"eyJhbGciOiJSUzI1NiIsImtpZCI6IjJiMzZhYjQxYTczOTJlMTRlNjM1ZmRlM2M2YWYwOWZlYmFhM2YyZDYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU291bGFpbWFuZSBPdWhtaWRhIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pTVWhtcXJaWlRkMzJ1ZC1IWWxCd3pMelRyRGZnQ3p5WUwzc1pWSDdyS1VzZkdrWHpLPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xlZ2FsZWFzZS05YjAxYiIsImF1ZCI6ImxlZ2FsZWFzZS05YjAxYiIsImF1dGhfdGltZSI6MTc3Nzk5NTY0OCwidXNlcl9pZCI6Ik9ySWtsMmFaRTVONTc4NklhaHJVQ2M5a0dPMzMiLCJzdWIiOiJPcklrbDJhWkU1TjU3ODZJYWhyVUNjOWtHTzMzIiwiaWF0IjoxNzc3OTk1OTUxLCJleHAiOjE3Nzc5OTk1NTEsImVtYWlsIjoib3VobWlkYXNvdWxhaW1hbmUyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE4MDU2OTExNjAwNjE5MDY4MjM1Il0sImVtYWlsIjpbIm91aG1pZGFzb3VsYWltYW5lMkBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.IVcabWSmzPGPD1WQD56BjDtE44jn7HRy_q8f6NPchfd8LJJ4_sWTgEH5uLgSpuc19kCBm1RcQ9F5epnMGwZW9yEEUJZnBN9DC4JQo6AGWmMMlAuABRiEJf4pjWyNMdwbC-CNFlzsEPZH4pSy9OPgnIjs81Uo-VA3aHyPP_2v2LSMz3IkKfomVLdBI4LSqz6JQ1ETi2D9NN1ukYbolNY1vPAcJPYR7WwgHzkgf1ygnf_eHWZfCHkcIuQ6N_CiIXlRzShQt9wwKaLqcFVcyOPt7CHxt6FqRiFZ63VkE8NlBwymFiTevdPQ6NX0ma5lWBFH3HdRb6MT7tuvNUxEowFTcQ"}` 
          },
          body: JSON.stringify(payload),
        });

        
        if (!response.ok) {

          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Secure Chat created successfully:", data);
        
        setQuery(""); 
        
      } catch (error) {
        console.error("Failed to transmit data package:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`flex shadow items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <input 
          type="text" 
          className='w-full outline-none' 
          placeholder={loading ? "Processing entry..." : "Ask LegalEase..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchSubmit} 
          disabled={loading}
        />
        <IoIosSearch size={20} className={loading ? "animate-pulse text-blue-500" : "text-gray-400"} />
    </div>
  )
}

export default SearchBox;