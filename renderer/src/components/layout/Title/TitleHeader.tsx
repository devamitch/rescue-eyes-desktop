import React from 'react'
import Styles from './titleheader.module.css'
const TitleHeader = ({ title }: { title: string }) => {
  return (
    <div className={Styles.container}>
        <h2>{title}</h2>
    </div>
  )
}

export default TitleHeader