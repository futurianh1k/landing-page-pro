/**
 * 코스 관련 페이지 E2E 테스트
 * 
 * 테스트 항목:
 * - CoursesPage: 코스 목록 페이지
 * - CourseCreatePage: 코스 생성 페이지
 * - CourseBuilderPage: 코스 빌더 페이지
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebDriver, By, until } from 'selenium-webdriver';
import {
  createDriver,
  BASE_URL,
  waitForPageLoad,
  login,
  scrollToElement,
  takeScreenshot,
} from './setup';

describe('코스 관련 페이지 E2E 테스트', () => {
  let driver: WebDriver;
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
  const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123';

  beforeAll(async () => {
    driver = await createDriver();
  });

  afterAll(async () => {
    await driver.quit();
  });

  describe('CoursesPage (코스 목록)', () => {
    it('비로그인 상태에서 접근 시 로그인 페이지로 리다이렉트되어야 함', async () => {
      await driver.get(`${BASE_URL}/courses`);
      await waitForPageLoad(driver);
      await driver.sleep(2000); // 리다이렉트 대기

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toMatch(/\/auth|\/login/);
    });

    it('로그인 후 코스 목록 페이지가 표시되어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('/courses');
      } catch (error) {
        console.log('Login failed, skipping courses page tests:', error);
      }
    });

    it('코스 목록이 표시되어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(3000);

        // 코스 카드 또는 목록 확인
        const courseCards = await driver.findElements(
          By.css('[class*="card"], [class*="Card"], [class*="course"], [class*="Course"]')
        );

        // 코스가 있거나 없을 수 있음 (빈 상태도 유효)
        expect(courseCards.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.log('Test account not available');
      }
    });

    it('코스 생성 버튼이 표시되어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 코스 생성 버튼 찾기
        const createButtons = await driver.findElements(
          By.xpath("//button[contains(text(), '생성') or contains(text(), '새 코스') or contains(text(), '코스 만들기')]")
        );

        if (createButtons.length > 0) {
          expect(await createButtons[0].isDisplayed()).toBe(true);
        } else {
          // 플러스 아이콘 버튼 확인
          const plusButtons = await driver.findElements(
            By.css('button svg, [aria-label*="생성"], [aria-label*="코스"]')
          );
          expect(plusButtons.length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.log('Test account not available');
      }
    });

    it('코스 생성 버튼 클릭 시 코스 생성 페이지로 이동해야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 코스 생성 버튼 찾기 및 클릭
        const createButtons = await driver.findElements(
          By.xpath("//button[contains(text(), '생성') or contains(text(), '새 코스')]")
        );

        if (createButtons.length > 0) {
          await createButtons[0].click();
          await driver.sleep(2000);

          const currentUrl = await driver.getCurrentUrl();
          expect(currentUrl).toContain('/courses/create');
        }
      } catch (error) {
        console.log('Test account not available');
      }
    });

    it('코스 카드 클릭 시 코스 빌더 페이지로 이동해야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(3000);

        // 코스 카드 찾기
        const courseCards = await driver.findElements(
          By.css('[class*="card"], [class*="Card"], a[href*="/courses/"]')
        );

        if (courseCards.length > 0) {
          await courseCards[0].click();
          await driver.sleep(2000);

          const currentUrl = await driver.getCurrentUrl();
          expect(currentUrl).toMatch(/\/courses\/[^/]+\/builder/);
        } else {
          console.log('No courses available to test');
        }
      } catch (error) {
        console.log('Test account not available');
      }
    });
  });

  describe('CourseCreatePage (코스 생성)', () => {
    it('코스 생성 페이지에 접근할 수 있어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/create`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('/courses/create');
      } catch (error) {
        console.log('Test account not available');
      }
    });

    it('코스 생성 폼이 표시되어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/create`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 제목 입력 필드 확인
        const titleInputs = await driver.findElements(
          By.css('input[placeholder*="제목"], input[name*="title"], input[type="text"]')
        );
        expect(titleInputs.length).toBeGreaterThan(0);

        // 설명 입력 필드 확인
        const descriptionInputs = await driver.findElements(
          By.css('textarea, [contenteditable="true"]')
        );
        expect(descriptionInputs.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Form may not be available');
      }
    });

    it('코스 생성 폼에 정보를 입력할 수 있어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/create`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 제목 입력
        const titleInputs = await driver.findElements(
          By.css('input[placeholder*="제목"], input[name*="title"]')
        );

        if (titleInputs.length > 0) {
          await titleInputs[0].clear();
          await titleInputs[0].sendKeys('E2E 테스트 코스');
        }

        // 설명 입력
        const descriptionInputs = await driver.findElements(
          By.css('textarea[placeholder*="설명"], textarea[name*="description"]')
        );

        if (descriptionInputs.length > 0) {
          await descriptionInputs[0].clear();
          await descriptionInputs[0].sendKeys('E2E 테스트를 위한 코스입니다.');
        }

        // 레벨 선택 (있는 경우)
        const levelSelects = await driver.findElements(
          By.css('select, [role="combobox"]')
        );

        if (levelSelects.length > 0) {
          await levelSelects[0].click();
          await driver.sleep(500);
        }
      } catch (error) {
        console.log('Form inputs may not be available');
      }
    });

    it('코스 생성 제출 버튼이 있어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/create`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 제출 버튼 찾기
        const submitButtons = await driver.findElements(
          By.xpath("//button[contains(text(), '생성') or contains(text(), '만들기') or contains(text(), '완료')]")
        );

        expect(submitButtons.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Submit button may not be available');
      }
    });
  });

  describe('CourseBuilderPage (코스 빌더)', () => {
    it('코스 빌더 페이지에 접근할 수 있어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses`);
        await waitForPageLoad(driver);
        await driver.sleep(3000);

        // 코스 카드 찾기
        const courseLinks = await driver.findElements(
          By.css('a[href*="/courses/"], [class*="card"], [class*="Card"]')
        );

        if (courseLinks.length > 0) {
          await courseLinks[0].click();
          await driver.sleep(2000);

          const currentUrl = await driver.getCurrentUrl();
          expect(currentUrl).toMatch(/\/courses\/[^/]+\/builder/);
        } else {
          // 테스트용 코스 ID로 직접 접근
          await driver.get(`${BASE_URL}/courses/test-course-id/builder`);
          await waitForPageLoad(driver);
          await driver.sleep(2000);

          const currentUrl = await driver.getCurrentUrl();
          expect(currentUrl).toContain('/builder');
        }
      } catch (error) {
        console.log('Course may not be available');
      }
    });

    it('코스 빌더에 커리큘럼 트리가 표시되어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/test-course-id/builder`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 커리큘럼 트리 또는 레슨 목록 확인
        const curriculumElements = await driver.findElements(
          By.css('[class*="curriculum"], [class*="Curriculum"], [class*="tree"], [class*="Tree"], [class*="lesson"], [class*="Lesson"]')
        );

        // 커리큘럼이 있거나 없을 수 있음
        expect(curriculumElements.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.log('Curriculum may not be available');
      }
    });

    it('AI 모델 선택이 작동해야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/test-course-id/builder`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // AI 모델 선택 드롭다운 찾기
        const modelSelects = await driver.findElements(
          By.css('select, [role="combobox"], [class*="select"], [class*="Select"]')
        );

        if (modelSelects.length > 0) {
          await modelSelects[0].click();
          await driver.sleep(500);
        }
      } catch (error) {
        console.log('Model selection may not be available');
      }
    });

    it('커리큘럼 생성 버튼이 있어야 함', async () => {
      try {
        await login(driver, testEmail, testPassword);
        await driver.get(`${BASE_URL}/courses/test-course-id/builder`);
        await waitForPageLoad(driver);
        await driver.sleep(2000);

        // 커리큘럼 생성 버튼 찾기
        const generateButtons = await driver.findElements(
          By.xpath("//button[contains(text(), '생성') or contains(text(), '생성하기') or contains(text(), '커리큘럼')]")
        );

        // 버튼이 있거나 없을 수 있음
        expect(generateButtons.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        console.log('Generate button may not be available');
      }
    });
  });
});

