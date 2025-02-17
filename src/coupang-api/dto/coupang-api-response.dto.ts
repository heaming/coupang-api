export class CoupangApiResponse<T> {
  code: number; // 서버 응답 코드
  message: string; // 서버 응답 메시지
  data: T[]; // 결과 리스트 (없을 경우 빈 배열)
  nextToken?: string; // 다음 페이지 요청 시 필요한 토큰 (마지막 페이지인 경우 빈 값)

  constructor(code: number, message: string, data: T[], nextToken?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.nextToken = nextToken || null;
  }
}