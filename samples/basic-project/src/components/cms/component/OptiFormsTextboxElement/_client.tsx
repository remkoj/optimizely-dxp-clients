'use client'

import type { OptiFormsTextboxElementDataFragment } from "@/gql/graphql"
import { useState, useId, type FunctionComponent } from "react";


export const ClientComponent: FunctionComponent<{id?: string, data: OptiFormsTextboxElementDataFragment}> = ({ id, data }) => 
{
  const reactId = useId()
  const [currentValue, setCurrentValue] = useState(data.PredefinedValue ?? undefined)

  return <>
    <label htmlFor={ id ?? reactId }>{data.Label}</label>
    <input id={ id ?? reactId } type={ getFieldType(data.Validators) } placeholder={data.Placeholder ?? undefined} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} autoComplete={ data.AutoComplete ?? undefined } title={data.Tooltip ?? undefined} />
  </>
}

export default ClientComponent

function getFieldType(validators: {type?: string | null}[] | undefined)
{
  if (!validators)
    return 'text'
  if (validators.some(x => x.type?.startsWith('email')))
    return 'email'
  return 'text'
}