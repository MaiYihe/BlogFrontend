import axios from 'axios'

export interface PresignResp {
  url: string
  expiresAt: string
}

/** 获取 OSS 图片的预签名 URL（命名导出） */
export const fetchFigureUrl = async (objectKey: string): Promise<PresignResp> => {
  const { data } = await axios.get<PresignResp>('/api/oss/figureUrl', {
    params: { objectKey },
  })
  return data
}


/** 同时暴露一个默认导出，防止“命名导出未找到”的情况 */
export default { fetchFigureUrl }
