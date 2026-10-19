

export default function Home() {
  return (

    <main>
      <h1>Invoice Review</h1>
      <p>Upload an invoice and review its details.</p>


      <form>
        <section> 

          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-up preview-icon"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3" /></svg>
          
          <h2>Upload Invoice PDF</h2>
          <p>Choose a PDF file from your computer:</p>
          <input type="file" accept=".pdf" required/>
        </section>

        <h3>Invoice Details</h3>

        <label htmlFor="vendorName">Vendor Name</label>
        <input type="text" id="vendorName" placeholder="Enter vendor name" required/>
        
        <label htmlFor="invoiceNumber">Invoice Number</label>
        <input type="text" id="invoiceNumber" placeholder="e.g. BILL-1001" required/>
        
        <label htmlFor="amountDue">Amount Due</label>
        <input type="number" id="amountDue" step="0.01" placeholder="0.00" min="0.01"required/>
      
        <label htmlFor="dueDate">Due Date</label>
        <input type="date" id="dueDate" placeholder="MM/DD/YYYY" required/>

        <div className="form-actions">
          <button type="button">Reject</button>
          <button type="submit">Approve Invoice</button>
        </div>

      </form>

    



    </main>
    
  );
}
