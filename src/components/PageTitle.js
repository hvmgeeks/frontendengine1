import React, { useState, useEffect } from 'react'

function PageTitle({ title }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);
  return (
    <div className='mt-2'>
      <h1 className={isMobile ? 'text-lg' : ''}>{title}</h1>
    </div>
  )
}

export default PageTitle